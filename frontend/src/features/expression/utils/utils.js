import {
  HandLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let drawingCtx = null;
let points = [];
let isDrawing = false;
let isDetecting = false;
let lastInferenceTime = 0;
let lastInferenceDuration = 0;
let lastFrameTime = 0;
let lastHudUpdate = 0;
let averageFps = 60;
let lastPoint = null;
let smoothedPoint = null;
let lastRawPoint = null;
let lastStatus = "";
let lastPinchStatus = false;
let penFilter = null;
let initPromise = null;
let strokeHasInk = false;
let lastVideoKeepAlive = 0;
let missingFrames = 0;
let lastLandmarks = null;
let lastIndexPosition = null;
let clearGestureStartedAt = 0;
let clearCountdown = null;
let clearTriggered = false;

const TARGET_RENDER_FPS = 60;
const TARGET_TRACKING_FPS = 60;
const TRACKING_INTERVAL = 1000 / TARGET_TRACKING_FPS;
const INFERENCE_BACKOFF = 1;
const START_THRESHOLD = 0.045;
const END_THRESHOLD = 0.065;
const MAX_MISSING_FRAMES = 10;
const LONG_MISSING_THRESHOLD = 15;
const CLEAR_HOLD_MS = 2000;
const SMOOTHING_WINDOW = 1;
const JUMP_DISTANCE = 95;
const PEN_EMA_ALPHA = 0.78;
const HUD_UPDATE_INTERVAL = 180;
const VIDEO_KEEP_ALIVE_INTERVAL = 500;
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;
const CAMERA_CONSTRAINTS = {
  video: {
    width: { ideal: 640 },
    height: { ideal: 480 },
    aspectRatio: { ideal: 4 / 3 },
    frameRate: { ideal: 60, max: 60 },
  },
};

class Kalman1D {
  constructor({ processNoise = 0.01, measurementNoise = 5 } = {}) {
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
    this.error = 1;
    this.value = 0;
    this.initialized = false;
  }

  filter(measurement) {
    if (!this.initialized) {
      this.value = measurement;
      this.initialized = true;
      return measurement;
    }

    this.error += this.processNoise;
    const gain = this.error / (this.error + this.measurementNoise);
    this.value += gain * (measurement - this.value);
    this.error *= 1 - gain;
    return this.value;
  }
}

class PointFilter {
  constructor(options) {
    this.xFilter = new Kalman1D(options);
    this.yFilter = new Kalman1D(options);
  }

  filter(point) {
    return {
      x: this.xFilter.filter(point.x),
      y: this.yFilter.filter(point.y),
    };
  }
}

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const lerp = (start, end, amount) =>
  start + (end - start) * amount;

const distanceBetween = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const getCanvasPoint = (landmark, canvas) => ({
  x: (1 - landmark.x) * canvas.width,
  y: landmark.y * canvas.height,
});

const isFingerExtended = (landmarks, tip, pip) =>
  landmarks[tip].y < landmarks[pip].y;

const isOpenPalm = (landmarks) => {
  if (!landmarks) return false;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexBase = landmarks[5];
  const thumbSpread = Math.abs(thumbTip.x - indexBase.x) > 0.08;

  return (
    thumbSpread &&
    isFingerExtended(landmarks, 8, 6) &&
    isFingerExtended(landmarks, 12, 10) &&
    isFingerExtended(landmarks, 16, 14) &&
    isFingerExtended(landmarks, 20, 18) &&
    distanceBetween(thumbTip, wrist) > 0.18
  );
};

const hasLiveVideoTrack = (stream) =>
  stream?.getVideoTracks().some((track) => track.readyState === "live");

const attachStreamToVideo = async (video, stream) => {
  if (!video || !stream) return;

  video.style.zIndex = "1";
  video.style.backgroundColor = "transparent";
  video.style.display = "block";

  if (video.srcObject !== stream) {
    video.srcObject = stream;
  }

  if (video.paused || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await video.play();
  }
};

const keepVideoRendering = (video, stream, now) => {
  if (!video || now - lastVideoKeepAlive < VIDEO_KEEP_ALIVE_INTERVAL) return;

  lastVideoKeepAlive = now;

  if (stream && video.srcObject !== stream) {
    video.srcObject = stream;
  }

  // Some browsers pause a muted camera element after GPU-heavy work; restart it
  // without touching the canvas so the live preview stays behind the strokes.
  if (video.srcObject && video.paused) {
    video.play().catch(() => {});
  }
};

const getCanvasContexts = (canvasRef) => {
  if (!drawingCtx && canvasRef.current) {
    canvasRef.current.style.zIndex = "2";
    canvasRef.current.style.pointerEvents = "none";
    canvasRef.current.style.backgroundColor = "transparent";

    drawingCtx = canvasRef.current.getContext("2d", {
      alpha: true,
    });
    drawingCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    configureDrawingContext();
  }
};

const syncCanvasSize = (canvas) => {
  // Keep the backing store identical to the 640x480 video box.
  if (canvas.width === CANVAS_WIDTH && canvas.height === CANVAS_HEIGHT) {
    return false;
  }

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  return true;
};

const configureDrawingContext = () => {
  if (!drawingCtx) return;

  drawingCtx.lineCap = "round";
  drawingCtx.lineJoin = "round";
  drawingCtx.strokeStyle = "#00ff41";
  drawingCtx.shadowColor = "#821c1a";
  drawingCtx.shadowBlur = 2;
  drawingCtx.globalAlpha = 1;
  drawingCtx.globalCompositeOperation = "source-over";
};

const resetStroke = () => {
  isDrawing = false;
  strokeHasInk = false;
  lastPoint = null;
  lastRawPoint = null;
  smoothedPoint = null;
  points = [];
  penFilter = null;
  drawingCtx?.beginPath();
};

export const resetAirWritingState = (ctx) => {
  resetStroke();
  lastInferenceTime = 0;
  lastInferenceDuration = 0;
  lastFrameTime = 0;
  lastHudUpdate = 0;
  lastStatus = "";
  lastPinchStatus = false;
  lastVideoKeepAlive = 0;
  missingFrames = 0;
  lastLandmarks = null;
  lastIndexPosition = null;
  clearGestureStartedAt = 0;
  clearCountdown = null;
  clearTriggered = false;

  if (ctx) {
    drawingCtx = ctx;
  }
};

const updateStatus = (setText, status) => {
  if (lastStatus !== status) {
    lastStatus = status;
    setText(status);
  }
};

const updateHud = (setHud, status, pinchActive, fps, avgFps, now) => {
  if (!setHud || now - lastHudUpdate < HUD_UPDATE_INTERVAL) {
    return;
  }

  lastHudUpdate = now;
  setHud({
    fps: Math.round(fps),
    averageFps: Math.round(avgFps),
    status,
    pinchActive,
    writingMode: pinchActive,
    handDetected: missingFrames === 0 && Boolean(lastLandmarks),
    trackingLost: missingFrames > MAX_MISSING_FRAMES,
    missingFrames,
    maxMissingFrames: MAX_MISSING_FRAMES,
    clearCountdown,
  });
};

const smoothPoint = (rawPoint) => {
  points.push(rawPoint);

  if (points.length > SMOOTHING_WINDOW) {
    points.shift();
  }

  const averaged = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  const movingAverage = {
    x: averaged.x / points.length,
    y: averaged.y / points.length,
  };

  if (!penFilter) {
    penFilter = new PointFilter({
      processNoise: 0.2,
      measurementNoise: 0.8,
    });
  }

  const kalmanPoint = penFilter.filter(movingAverage);

  if (!smoothedPoint) {
    smoothedPoint = kalmanPoint;
    return kalmanPoint;
  }

  smoothedPoint = {
    x: lerp(smoothedPoint.x, kalmanPoint.x, PEN_EMA_ALPHA),
    y: lerp(smoothedPoint.y, kalmanPoint.y, PEN_EMA_ALPHA),
  };

  return smoothedPoint;
};

const drawPenSegment = (point) => {
  if (!drawingCtx || !lastPoint) {
    return;
  }

  const speed = distanceBetween(point, lastPoint);
  const lineWidth = clamp(8 - speed * 0.1, 3.5, 7.5);
  const steps = Math.max(1, Math.ceil(speed / 10));

  drawingCtx.lineWidth = lineWidth;
  drawingCtx.beginPath();
  drawingCtx.moveTo(lastPoint.x, lastPoint.y);

  for (let step = 1; step <= steps; step += 1) {
    const amount = step / steps;
    drawingCtx.lineTo(
      lerp(lastPoint.x, point.x, amount),
      lerp(lastPoint.y, point.y, amount)
    );
  }

  drawingCtx.stroke();
};

const drawWithIndexPoint = (rawPoint) => {
  if (!drawingCtx || !rawPoint) return;

  const jumped =
    lastRawPoint &&
    distanceBetween(rawPoint, lastRawPoint) > JUMP_DISTANCE;

  if (jumped) {
    resetStroke();
  }

  const point = smoothPoint(rawPoint);

  if (!isDrawing || !lastPoint) {
    drawingCtx.beginPath();
    drawingCtx.moveTo(point.x, point.y);
    isDrawing = true;
    strokeHasInk = true;
  } else {
    drawPenSegment(point);
    strokeHasInk = true;
  }

  lastPoint = point;
  lastRawPoint = rawPoint;
};

const createHandLandmarker = async (resolver, delegate) =>
  HandLandmarker.createFromOptions(
    resolver,
    {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate,
      },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.45,
      minHandPresenceConfidence: 0.45,
      minTrackingConfidence: 0.45,
    }
  );

export const init = async ({
  handRef,
  videoRef,
  streamRef,
}) => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const resolver =
      await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

    if (!handRef.current) {
      try {
        handRef.current = await createHandLandmarker(resolver, "GPU");
      } catch {
        handRef.current = await createHandLandmarker(resolver, "CPU");
      }
    }

    if (!hasLiveVideoTrack(streamRef.current)) {
      streamRef.current =
        await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
    }

    await new Promise((resolve) => {
      const video = videoRef.current;

      if (!video) {
        resolve();
        return;
      }

      video.onloadedmetadata = async () => {
        await attachStreamToVideo(video, streamRef.current);
        resolve();
      };

      attachStreamToVideo(video, streamRef.current).then(resolve);
    });
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
};

export const detect = ({
  handRef,
  videoRef,
  streamRef,
  canvasRef,
  setText,
  setHud,
  onStrokeComplete,
  onClearCanvas,
  fromLoop = false,
}) => {
  if (!fromLoop && isDetecting) {
    return;
  }

  isDetecting = true;

  if (
    !handRef.current ||
    !videoRef.current ||
    !canvasRef.current
  ) {
    isDetecting = false;
    return;
  }

  const now = performance.now();
  const canvas = canvasRef.current;

  getCanvasContexts(canvasRef);
  keepVideoRendering(videoRef.current, streamRef?.current, now);
  const drawingResized = syncCanvasSize(canvas);

  if (drawingResized) {
    configureDrawingContext();
  }

  const frameDelta = lastFrameTime ? now - lastFrameTime : 1000 / TARGET_RENDER_FPS;
  const currentFps = 1000 / frameDelta;
  averageFps = averageFps * 0.92 + currentFps * 0.08;
  lastFrameTime = now;

  const adaptiveTrackingInterval = Math.max(
    TRACKING_INTERVAL,
    lastInferenceDuration * INFERENCE_BACKOFF
  );

  
  if (now - lastInferenceTime >= adaptiveTrackingInterval) {
    lastInferenceTime = now;

    const inferenceStart = performance.now();
    const results =
      handRef.current.detectForVideo(
        videoRef.current,
        now
      );
    lastInferenceDuration = performance.now() - inferenceStart;

    const hasLandmarks =
      results.landmarks &&
      results.landmarks.length > 0;

    if (hasLandmarks) {
      const landmarks = results.landmarks[0];
      const thumb = landmarks[4];
      const index = landmarks[8];
      const rawPoint = getCanvasPoint(index, canvas);

      lastLandmarks = landmarks;
      lastIndexPosition = rawPoint;
      missingFrames = 0;

      const pinchDistance = Math.hypot(
        index.x - thumb.x,
        index.y - thumb.y
      );

      const pinchActive = lastPinchStatus
        ? pinchDistance < END_THRESHOLD
        : pinchDistance < START_THRESHOLD;

      if (pinchActive) {
        drawWithIndexPoint(rawPoint);
      } else if (lastPinchStatus || isDrawing) {
        if (isDrawing && strokeHasInk) {
          onStrokeComplete?.();
        }

        resetStroke();
      }

      lastPinchStatus = pinchActive;

      if (isOpenPalm(landmarks) && !pinchActive) {
        if (!clearGestureStartedAt) {
          clearGestureStartedAt = now;
          clearTriggered = false;
        }

        const clearProgress = now - clearGestureStartedAt;
        clearCountdown = Math.max(
          1,
          Math.ceil((CLEAR_HOLD_MS - clearProgress) / (CLEAR_HOLD_MS / 3))
        );

        if (clearProgress >= CLEAR_HOLD_MS && !clearTriggered) {
          clearTriggered = true;
          clearCountdown = null;
          onClearCanvas?.();
          resetStroke();
        }
      } else {
        clearGestureStartedAt = 0;
        clearCountdown = null;
        clearTriggered = false;
      }

      updateStatus(setText, pinchActive ? "Writing" : "Ready");
    } else {
      missingFrames += 1;
      clearGestureStartedAt = 0;
      clearCountdown = null;
      clearTriggered = false;

      if (
        lastPinchStatus &&
        missingFrames <= MAX_MISSING_FRAMES &&
        lastIndexPosition
      ) {
        drawWithIndexPoint(lastIndexPosition);
        updateStatus(setText, "Tracking Lost");
      } else if (missingFrames >= LONG_MISSING_THRESHOLD) {
        lastPinchStatus = false;

        if (isDrawing && strokeHasInk) {
          onStrokeComplete?.();
        }

        resetStroke();
        updateStatus(setText, "Hand Not Detected");
      } else {
        updateStatus(setText, lastPinchStatus ? "Tracking Lost" : "Hand Not Detected");
      }
    }
  }

  updateHud(
    setHud,
    lastStatus || "Ready",
    lastPinchStatus,
    currentFps,
    averageFps,
    now
  );

  requestAnimationFrame((timestamp) =>
    detect({
      handRef,
      videoRef,
      streamRef,
      canvasRef,
      setText,
      setHud,
      onStrokeComplete,
      onClearCanvas,
      fromLoop: true,
      timestamp,
    })
  );
};
