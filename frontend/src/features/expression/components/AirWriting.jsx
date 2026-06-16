import { useCallback, useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { detect, init, resetAirWritingState } from "../utils/utils";

const getFpsClass = (fps) => {
  if (fps < 30) return "text-red-300 border-red-400/60";
  if (fps < 45) return "text-yellow-200 border-yellow-300/60";
  return "text-cyan-100 border-cyan-300/50";
};

const OCR_SCALE = 3;
const OCR_PADDING = 28;
const OCR_MIN_INK_PIXELS = 40;

const normalizeDetectedText = (text) =>
  text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const createOcrCanvas = (sourceCanvas) => {
  const sourceCtx = sourceCanvas?.getContext("2d", { willReadFrequently: true });

  if (!sourceCanvas || !sourceCtx) return null;

  const { width, height } = sourceCanvas;
  const imageData = sourceCtx.getImageData(0, 0, width, height);
  const { data } = imageData;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let inkPixels = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];

      if (alpha > 20) {
        inkPixels += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (inkPixels < OCR_MIN_INK_PIXELS) return null;

  const cropX = Math.max(0, minX - OCR_PADDING);
  const cropY = Math.max(0, minY - OCR_PADDING);
  const cropWidth = Math.min(width - cropX, maxX - minX + OCR_PADDING * 2);
  const cropHeight = Math.min(height - cropY, maxY - minY + OCR_PADDING * 2);
  const ocrCanvas = document.createElement("canvas");
  const ocrCtx = ocrCanvas.getContext("2d");

  ocrCanvas.width = Math.max(1, cropWidth * OCR_SCALE);
  ocrCanvas.height = Math.max(1, cropHeight * OCR_SCALE);
  ocrCtx.fillStyle = "#ffffff";
  ocrCtx.fillRect(0, 0, ocrCanvas.width, ocrCanvas.height);
  ocrCtx.imageSmoothingEnabled = true;
  ocrCtx.imageSmoothingQuality = "high";
  ocrCtx.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    ocrCanvas.width,
    ocrCanvas.height
  );

  const processed = ocrCtx.getImageData(0, 0, ocrCanvas.width, ocrCanvas.height);

  for (let index = 0; index < processed.data.length; index += 4) {
    const alpha = processed.data[index + 3];
    const isInk = alpha > 20;

    processed.data[index] = isInk ? 0 : 255;
    processed.data[index + 1] = isInk ? 0 : 255;
    processed.data[index + 2] = isInk ? 0 : 255;
    processed.data[index + 3] = 255;
  }

  ocrCtx.putImageData(processed, 0, 0);
  return ocrCanvas;
};

const AirWriting = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handRef = useRef(null);
  const streamRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  const recognitionRunningRef = useRef(false);
  const recognitionTimerRef = useRef(null);

  const [text, setText] = useState("Ready");
  const [detectedWords, setDetectedWords] = useState([]);
  const [ocrStatus, setOcrStatus] = useState("Idle");
  const [hud, setHud] = useState({
    fps: 0,
    averageFps: 0,
    status: "Ready",
    pinchActive: false,
    writingMode: false,
    handDetected: false,
    trackingLost: false,
    missingFrames: 0,
    maxMissingFrames: 10,
    clearCountdown: null,
  });

  const getOcrWorker = useCallback(async () => {
    if (ocrWorkerRef.current) {
      return ocrWorkerRef.current;
    }

    setOcrStatus("Loading OCR");
    const worker = await Tesseract.createWorker("eng", 1);

    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ",
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      user_defined_dpi: "300",
    });

    ocrWorkerRef.current = worker;
    return worker;
  }, []);

  const recognizeText = useCallback(async () => {
    const ocrCanvas = createOcrCanvas(canvasRef.current);

    if (!ocrCanvas || recognitionRunningRef.current) {
      return;
    }

    recognitionRunningRef.current = true;
    setOcrStatus("Recognizing");

    try {
      const worker = await getOcrWorker();
      const {
        data: { text: rawText, confidence },
      } = await worker.recognize(ocrCanvas);
      const words = normalizeDetectedText(rawText).split(" ").filter(Boolean);

      if (words.length > 0) {
        setDetectedWords((currentWords) => {
          const latestWords = words.map((word) => ({
            word,
            confidence: Math.round(confidence),
            id: `${word}-${Date.now()}`,
          }));
          const latestWordSet = new Set(words);
          const withoutDuplicates = currentWords.filter(
            (item) => !latestWordSet.has(item.word)
          );

          return [
            ...latestWords,
            ...withoutDuplicates,
          ].slice(0, 12);
        });
        setOcrStatus("Detected");
      } else {
        setOcrStatus("No text found");
      }
    } catch (error) {
      console.error("OCR failed", error);
      setOcrStatus("OCR error");
    } finally {
      recognitionRunningRef.current = false;
    }
  }, [getOcrWorker]);

  const scheduleRecognition = useCallback(() => {
    window.clearTimeout(recognitionTimerRef.current);
    recognitionTimerRef.current = window.setTimeout(() => {
      recognizeText();
    }, 650);
  }, [recognizeText]);

  useEffect(() => {
    const activeStreamRef = streamRef;
    const activeWorkerRef = ocrWorkerRef;

    init({
      handRef,
      videoRef,
      streamRef,
    });

    return () => {
      window.clearTimeout(recognitionTimerRef.current);
      activeStreamRef.current?.getTracks().forEach((track) => track.stop());
      activeWorkerRef.current?.terminate();
    };
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resetAirWritingState(ctx);
    setText("Ready");
    setOcrStatus("Idle");
    setHud((current) => ({
      ...current,
      status: "Ready",
      pinchActive: false,
      writingMode: false,
      handDetected: false,
      trackingLost: false,
      missingFrames: 0,
      clearCountdown: null,
    }));
  }, []);

  const startWriting = async () => {
    await init({
      handRef,
      videoRef,
      streamRef,
    });

    detect({
      handRef,
      videoRef,
      streamRef,
      canvasRef,
      setText,
      setHud,
      onStrokeComplete: scheduleRecognition,
      onClearCanvas: clearCanvas,
    });
  };

  return (
    <div className="min-h-screen overflow-auto bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto grid w-fit grid-cols-[640px_280px] gap-4 rounded-lg border border-white/15 bg-neutral-900/90 p-5 shadow-2xl">
        <section className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="hud-panel px-4 py-3">
              <div className="text-xs uppercase tracking-[0.16em] text-white/60">
                Air Writing
              </div>
              <div className="mt-2 text-xl font-black uppercase leading-none font-thin text-white">
                {text}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-regular uppercase tracking-[0.14em]">
                <span className="hud-chip">
                  Writing: {hud.writingMode ? "ON" : "OFF"}
                </span>
                <span className="hud-chip">
                  Hand: {hud.handDetected ? "Detected" : "Not Detected"}
                </span>
                <span className="hud-chip">
                  Pinch: {hud.pinchActive ? "Detected" : "Open"}
                </span>
              </div>
            </div>

            <div
              className={`min-w-44 rounded-md border bg-black/60 px-4 py-3 font-mono text-sm ${getFpsClass(hud.fps)}`}
            >
              <div>FPS: {hud.fps}</div>
              <div>AVG: {hud.averageFps}</div>
              <div>STATUS: {hud.trackingLost ? "TRACKING LOST" : hud.status.toUpperCase()}</div>
              <div>MISSING: {hud.missingFrames}/{hud.maxMissingFrames}</div>
            </div>
          </div>

      
          <div className="air-writing-stage relative h-[480px] w-[640px] overflow-hidden rounded-lg border border-white/20 bg-neutral-950">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              width={640}
              height={480}
              className="air-writing-video absolute inset-0 z-[1] h-[480px] w-[640px] scale-x-[-1] object-fill"
              style={{
                backgroundColor: "transparent",
                display: "block",
                zIndex: 1,
              }}
            />

            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="air-writing-canvas absolute inset-0 z-[2] h-[480px] w-[640px]"
              style={{
                backgroundColor: "transparent",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              className="hud-button"
              onClick={startWriting}
            >
              Start
            </button>

            <button
              className="hud-button"
              onClick={recognizeText}
            >
              Recognize Text
            </button>

            <button
              className="hud-button hud-button-danger"
              onClick={clearCanvas}
            >
              Clear Canvas
            </button>
          </div>

          <div className="hud-panel px-4 py-3 font-mono text-sm uppercase text-white/75">
            {hud.clearCountdown
              ? `Canvas Clearing: Clearing in ${hud.clearCountdown}...`
              : "Canvas Clearing: Hold open palm"}
          </div>
        </section>

        <aside className="hud-panel flex min-h-[480px] flex-col px-4 py-4">
          <div className="text-xs uppercase tracking-[0.16em] text-white/60">
            Detected Words
          </div>
          <div className="mt-2 rounded-md border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs uppercase text-white/70">
            OCR: {ocrStatus}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {detectedWords.length === 0 ? (
              <div className="rounded-md border border-dashed border-white/15 px-3 py-4 text-sm text-white/50">
                No words detected yet
              </div>
            ) : (
              detectedWords.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-white/12 bg-white/[0.06] px-3 py-2"
                >
                  <div className="text-lg font-black uppercase leading-tight">
                    {item.word}
                  </div>
                  <div className="mt-1 font-mono text-xs text-white/55">
                    Confidence: {item.confidence}%
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AirWriting;
