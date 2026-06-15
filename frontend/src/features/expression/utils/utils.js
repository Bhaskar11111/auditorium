import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export const init = async ({landmarkerRef,videoRef,streamRef}) => {
    const resolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );

    landmarkerRef.current = await FaceLandmarker.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      },
      runningMode: "VIDEO",
      outputFaceBlendshapes: true,
    });

    streamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    videoRef.current.srcObject = streamRef.current;

    videoRef.current.onloadeddata = ()=>detect()
  }

export  const detect = ({landmarkerRef,videoRef,setExpression}) => {
    if (!landmarkerRef || !videoRef.current) return;

    const results = landmarkerRef.current.detectForVideo(
      videoRef.current,
      performance.now()
    );

    if (results.faceBlendshapes?.length > 0) {
      const shapes = results.faceBlendshapes[0].categories;

      const smile =
        shapes.find((s) => s.categoryName === "mouthSmileLeft")?.score || 0;

      const brow =
        shapes.find((s) => s.categoryName === "browInnerUp")?.score || 0;

      const eye =
        shapes.find((s) => s.categoryName === "eyeSquintLeft")?.score || 0;

      const jaw =
        shapes.find((s) => s.categoryName === "jawOpen")?.score || 0;

      const frown =
        shapes.find((s) => s.categoryName === "mouthFrownLeft")?.score || 0;

      // console.log(
      //   shapes.find((e) => e.categoryName === "mouthFrownRight")?.score
      // );

      if (smile > 0.5) setExpression("Happy");
      else if (brow > 0.5) setExpression("Surprised");
      else if (frown > 0.01) setExpression("Sad");
      else if (jaw > 0.3) setExpression("Surprised");
      else if (eye > 0.4) setExpression("Angry");
      else setExpression("Neutral");
      // console.log(shapes.find((e)=>e.categoryName==='mouthFrownLeft').score)
    }


    requestAnimationFrame(detect);
  };
