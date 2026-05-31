import { useEffect, useRef, useState } from "react";
import { detect, init } from "../utils/utils";

const FaceExpression = () => {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef=useRef(null)

  const [expression, setExpression] = useState("Detecting...");

  useEffect(() => {
    init({landmarkerRef,videoRef,streamRef});
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <video ref={videoRef} autoPlay playsInline width={400} />
      <h1 className="text-2xl mt-4">{expression}</h1>
      <button onClick={()=>detect({landmarkerRef,videoRef,setExpression})}>Catch Expression</button>
    </div>
  );
};

export default FaceExpression;