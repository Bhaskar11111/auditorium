import { useCallback, useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { detect, init, resetAirWritingState } from "../utils/utils";
import Logout from "../../../auth/components/Logout";

const getFpsClass = (fps) => {
  if (fps < 30) return "text-red-300 border-red-400/60";
  if (fps < 45) return "text-yellow-200 border-yellow-300/60";
  return "text-cyan-100 border-cyan-300/50";
};

const OCR_SCALE = 3;
const OCR_PADDING = 36;
const OCR_MIN_INK_PIXELS = 220;
const OCR_MIN_BOUNDS_WIDTH = 36;
const OCR_MIN_BOUNDS_HEIGHT = 32;
const OCR_RECOGNITION_DELAY_MS = 1500;
const OCR_MIN_EXACT_CONFIDENCE = 20;
const OCR_MIN_FUZZY_CONFIDENCE = 42;
const OCR_MIN_DISPLAY_LENGTH = 1;
const OCR_MIN_GENRE_LENGTH = 3;
const PLAYBACK_COOLDOWN_MS = 7000;
const SUPPORTED_GENRES = ["POP", "HIP-HOP", "ROCK", "EDM", "CLASSICAL", "METAL"];
const GENRE_ALIASES = {
  POP: ["POP", "PC", "PE", "PO","P 0", "P O ", "P0P", "P0", "PQP", "PO P", "P O P", "FO","F O"],
  "HIP-HOP": [
    "HIP HOP",
    "HIPHOP",
    "HIPPOP",
    "HIP OP",
    "HIP HP",
    "HIP",
    "HO",
    "H O P",
    "H O",
    "HE",
    "H E",
    "H C",
    "HC",
    "7I",
    "A I",
    "AI",
    "HI",
    "NO",
    "NI",
    "H1P",
    "HIPP",
    "HIPH",
    "HIPHO",
    "HIPH0P",
    "H1PHOP",
    "HIP-H",
    "HIP-H0P",
    "HIPHOPP",
  ],
  ROCK: ["ROCK", "ROK", "ROC", "ROL", "RO", "RE","RC", "R0CK", "R0K", "R0C", "R O C K","RE"],
  EDM: ["EDM", "EDN", "ED", "E D M", "E D","7D","7DM", "E2","EC", "EOM", "E0M", "FDM","FP","FI"],
  CLASSICAL: [
    "CLASSICAL",
    "CLASS",
    "CLAS",
    "CLA",
    "CLASICAL",
    "CLASSIC",
    "CLASSICA",
    "CLASIC",
    "CLASI",
    "CLASL",
    "CLASC",
    "CLAS5",
    "CLA55",

    "CL4SS",
    "CLSSICAL",
    "CLASSICL",
    "CLASSICALS",
    "CLA5SICAL",
    "C L A S S",
  ],
  METAL: [
    "METAL",
    "MET",
    "ME",
    "METL",
    "META",
    "MFTAL",
    "MFTL",
    "MELAL",
    "NETAL",
    "N5TAL",
    "HEAVY METAL",
    "HEAVYMETAL",
    "M E T A L",
  ],
};
const GENRE_PREFIXES = {
  POP: ["PO", "P0","PE"],
  "HIP-HOP": ["HIP", "H1P", "HIPH", "HIPHO","HO","HOP","HE","HC"],
  ROCK: ["RO", "R0", "ROC", "ROK", "ROL"],
  EDM: ["ED", "E D","EDM","EE","EN"],
  CLASSICAL: ["CLA", "CLAS", "CLASS", "CL4", "CLA5"],
  METAL: ["ME", "MET", "MFT", "MEL", "NET"],
};
const FALLBACK_VIDEOS = {
  POP: [
    { id: "JGwWNGJdvx8", title: "Ed Sheeran - Shape of You" },
    { id: "kJQP7kiw5Fk", title: "Luis Fonsi - Despacito" },
    { id: "RgKAFK5djSk", title: "Wiz Khalifa - See You Again" },
    { id: "OPf0YbXqDm0", title: "Mark Ronson - Uptown Funk" },
    { id: "hT_nvWreIhg", title: "OneRepublic - Counting Stars" },
    { id: "CevxZvSJLk8", title: "Katy Perry - Roar" },
    { id: "fRh_vgS2dFE", title: "Justin Bieber - Sorry" },
    { id: "YQHsXMglC9A", title: "Adele - Hello" },
  ],
  "HIP-HOP": [
    { id: "8UVNT4wvIGY", title: "Gotye - Somebody That I Used To Know" },
    { id: "uelHwf8o7_U", title: "Eminem ft. Rihanna - Love The Way You Lie" },
    { id: "XbGs_qK2PQA", title: "Eminem - Rap God" },
    { id: "YVkUvmDQ3HY", title: "Eminem - Without Me" },
    { id: "eJO5HU_7_1w", title: "Eminem - The Real Slim Shady" },
    { id: "tvTRZJ-4EyI", title: "Kendrick Lamar - HUMBLE." },
    { id: "2zNSgSzhBfM", title: "Drake - Hotline Bling" },
    { id: "iZJXvjeWlVA", title: "Dr. Dre - Still D.R.E." },
  ],
  ROCK: [
    { id: "fJ9rUzIMcZQ", title: "Queen - Bohemian Rhapsody" },
    { id: "hTWKbfoikeg", title: "Nirvana - Smells Like Teen Spirit" },
    { id: "ktvTqknDobU", title: "Imagine Dragons - Radioactive" },
    { id: "1w7OgIMMRc4", title: "Guns N' Roses - Sweet Child O' Mine" },
    { id: "eVTXPUF4Oz4", title: "Linkin Park - In The End" },
    { id: "kXYiU_JCYtU", title: "Linkin Park - Numb" },
    { id: "l482T0yNkeo", title: "AC/DC - Highway to Hell" },
    { id: "pAgnJDJN4VA", title: "AC/DC - Back In Black" },
  ],
  EDM: [
    { id: "60ItHLz5WEA", title: "Alan Walker - Faded" },
    { id: "YqeW9_5kURI", title: "Major Lazer & DJ Snake - Lean On" },
    { id: "IcrbM1l_BoI", title: "Avicii - Wake Me Up" },
    { id: "JRfuAukYTKg", title: "David Guetta - Titanium" },
    { id: "gCYcHz2k5x0", title: "The Chainsmokers - Don't Let Me Down" },
    { id: "PT2_F-1esPk", title: "The Chainsmokers - Closer" },
    { id: "ebXbLfLACGM", title: "Martin Garrix - Animals" },
    { id: "kOkQ4T5WO9E", title: "Calvin Harris - Summer" },
  ],
  CLASSICAL: [
    { id: "GRxofEmo3HA", title: "Beethoven - Moonlight Sonata" },
    { id: "4Tr0otuiQuU", title: "Mozart - Eine Kleine Nachtmusik" },
    { id: "jgpJVI3tDbY", title: "Vivaldi - Four Seasons" },
    { id: "ho9rZjlsyYY", title: "Bach - Cello Suite No. 1" },
    { id: "fOk8Tm815lE", title: "Tchaikovsky - Swan Lake" },
    { id: "q9bU12gXUyM", title: "Chopin - Nocturne Op. 9 No. 2" },
    { id: "rEGOihjqO9w", title: "Beethoven - Symphony No. 5" },
    { id: "GRxofEmo3HA", title: "Classical Essentials" },
  ],
  METAL: [
    { id: "CD-E-LDc384", title: "Metallica - Enter Sandman" },
    { id: "tAGnKpE4NCI", title: "Metallica - Nothing Else Matters" },
    { id: "WM8bTdBs-cw", title: "System Of A Down - Chop Suey!" },
    { id: "CSvFpBOe8eY", title: "System Of A Down - Toxicity" },
    { id: "iywaBOMvYLI", title: "Slipknot - Duality" },
    { id: "3mbvWn1EY6g", title: "Iron Maiden - The Trooper" },
    { id: "86URGgqONvA", title: "Black Sabbath - Paranoid" },
    { id: "AkFqg5wAuFk", title: "Avenged Sevenfold - Hail To The King" },
  ],
};

const normalizeDetectedText = (text) =>
  text
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const compactText = (text) =>
  normalizeDetectedText(text).replace(/[^A-Z0-9]/g, "");

const getDisplayTokens = (text) =>
  normalizeDetectedText(text)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => compactText(word).length >= OCR_MIN_DISPLAY_LENGTH);

const getGenreTokens = (text) =>
  getDisplayTokens(text).filter(
    (word) => compactText(word).length >= OCR_MIN_GENRE_LENGTH
  );

const levenshteinDistance = (a, b) => {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) => [row]);

  for (let col = 1; col <= b.length; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row <= a.length; row += 1) {
    for (let col = 1; col <= b.length; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const getGenreCandidates = (genre) =>
  [genre, ...GENRE_ALIASES[genre]].map((candidate) => ({
    normalized: normalizeDetectedText(candidate),
    compact: compactText(candidate),
  }));

const getBestGenreMatch = (compact) => {
  const matches = SUPPORTED_GENRES
    .flatMap((genre) =>
      getGenreCandidates(genre).map((candidate) => ({
        genre,
        distance: levenshteinDistance(compact, candidate.compact),
        candidateLength: candidate.compact.length,
      }))
    )
    .sort((a, b) => a.distance - b.distance || b.candidateLength - a.candidateLength);

  return matches[0] || null;
};

const matchGenrePrefix = (normalized, compact, confidence) => {
  if (confidence < OCR_MIN_EXACT_CONFIDENCE) {
    return null;
  }

  for (const genre of SUPPORTED_GENRES) {
    const prefixes = GENRE_PREFIXES[genre] || [];

    if (
      prefixes.some((prefix) => {
        const normalizedPrefix = normalizeDetectedText(prefix);
        const compactPrefix = compactText(prefix);

        return (
          normalized === normalizedPrefix ||
          compact === compactPrefix ||
          normalized.startsWith(normalizedPrefix) ||
          compact.startsWith(compactPrefix)
        );
      })
    ) {
      return genre;
    }
  }

  return null;
};

const matchGenre = (text, confidence = 100) => {
  const normalized = normalizeDetectedText(text);
  const compact = compactText(normalized);
  const tokens = getGenreTokens(normalized);

  if (!compact || compact.length < 2) {
    return null;
  }

  for (const genre of SUPPORTED_GENRES) {
    if (
      getGenreCandidates(genre).some(
        (candidate) =>
          normalized === candidate.normalized ||
          compact === candidate.compact
      )
    ) {
      return confidence >= OCR_MIN_EXACT_CONFIDENCE ? genre : null;
    }
  }

  for (const token of tokens) {
    const tokenCompact = compactText(token);

    for (const genre of SUPPORTED_GENRES) {
      if (
        getGenreCandidates(genre).some(
          (candidate) =>
            token === candidate.normalized ||
            tokenCompact === candidate.compact
        )
      ) {
        return confidence >= OCR_MIN_EXACT_CONFIDENCE ? genre : null;
      }
    }
  }

  if (
    normalized.includes("HIP HOP") ||
    normalized.includes("HIP-HOP") ||
    compact.includes("HIPHOP")
  ) {
    return confidence >= OCR_MIN_EXACT_CONFIDENCE ? "HIP-HOP" : null;
  }

  const prefixGenre = matchGenrePrefix(normalized, compact, confidence);

  if (prefixGenre) {
    return prefixGenre;
  }

  if (compact.length < OCR_MIN_GENRE_LENGTH) {
    return null;
  }

  const best = getBestGenreMatch(compact);

  if (!best || confidence < OCR_MIN_FUZZY_CONFIDENCE) {
    return null;
  }

  const lengthDifference = Math.abs(compact.length - best.candidateLength);
  const maxDistance = best.candidateLength >= 8 ? 2 : 1;

  return lengthDifference <= 1 && best.distance <= maxDistance ? best.genre : null;
};

const pickRandom = (items, recentIds = []) => {
  const recentSet = new Set(recentIds);
  const freshItems = items.filter((item) => !recentSet.has(item.id));
  const pool = freshItems.length > 0 ? freshItems : items;

  return pool[Math.floor(Math.random() * pool.length)];
};

const getGenreSearchLabel = (genre) =>
  ({
    "HIP-HOP": "hip hop",
    EDM: "electronic dance music",
  }[genre] || genre.toLowerCase());

const fetchGenreVideo = async (genre, recentIds = []) => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

  if (apiKey) {
    const query = encodeURIComponent(`${getGenreSearchLabel(genre)} official music playlist`);
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=12&q=${query}&key=${apiKey}`
    );

    if (response.ok) {
      const payload = await response.json();
      const results = payload.items
        ?.map((item) => ({
          id: item.id?.videoId,
          title: item.snippet?.title || `${genre} video`,
        }))
        .filter((item) => item.id);

      if (results?.length) {
        return pickRandom(results, recentIds);
      }
    }
  }

  return pickRandom(FALLBACK_VIDEOS[genre], recentIds);
};

const createOcrImages = (sourceCanvas) => {
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

  const boundsWidth = maxX - minX + 1;
  const boundsHeight = maxY - minY + 1;

  if (
    inkPixels < OCR_MIN_INK_PIXELS ||
    boundsWidth < OCR_MIN_BOUNDS_WIDTH ||
    boundsHeight < OCR_MIN_BOUNDS_HEIGHT
  ) {
    return null;
  }

  const cropX = Math.max(0, minX - OCR_PADDING);
  const cropY = Math.max(0, minY - OCR_PADDING);
  const cropWidth = Math.min(width - cropX, maxX - minX + OCR_PADDING * 2);
  const cropHeight = Math.min(height - cropY, maxY - minY + OCR_PADDING * 2);
  const inputCanvas = document.createElement("canvas");
  const inputCtx = inputCanvas.getContext("2d", { willReadFrequently: true });
  const processedCanvas = document.createElement("canvas");
  const processedCtx = processedCanvas.getContext("2d", { willReadFrequently: true });
  const outputWidth = Math.max(1, cropWidth * OCR_SCALE + OCR_PADDING * 2);
  const outputHeight = Math.max(1, cropHeight * OCR_SCALE + OCR_PADDING * 2);

  inputCanvas.width = outputWidth;
  inputCanvas.height = outputHeight;
  processedCanvas.width = outputWidth;
  processedCanvas.height = outputHeight;

  inputCtx.clearRect(0, 0, outputWidth, outputHeight);
  inputCtx.imageSmoothingEnabled = true;
  inputCtx.imageSmoothingQuality = "high";
  inputCtx.drawImage(
    sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    OCR_PADDING,
    OCR_PADDING,
    cropWidth * OCR_SCALE,
    cropHeight * OCR_SCALE
  );


  const transparentStroke = inputCtx.getImageData(0, 0, outputWidth, outputHeight);
  const processed = processedCtx.createImageData(outputWidth, outputHeight);
  const inkMask = new Uint8Array(outputWidth * outputHeight);

  for (let index = 0; index < transparentStroke.data.length; index += 4) {
    const alpha = transparentStroke.data[index + 3];
    const isInk = alpha > 18;
    inkMask[index / 4] = isInk ? 1 : 0;
  }

  
  for (let y = 0; y < outputHeight; y += 1) {
    for (let x = 0; x < outputWidth; x += 1) {
      const offset = y * outputWidth + x;
      const left = x > 0 ? offset - 1 : offset;
      const right = x < outputWidth - 1 ? offset + 1 : offset;
      const up = y > 0 ? offset - outputWidth : offset;
      const down = y < outputHeight - 1 ? offset + outputWidth : offset;
      const isInk =
        inkMask[offset] ||
        inkMask[left] ||
        inkMask[right] ||
        inkMask[up] ||
        inkMask[down];
      const index = offset * 4;

      processed.data[index] = isInk ? 0 : 255;
      processed.data[index + 1] = isInk ? 0 : 255;
      processed.data[index + 2] = isInk ? 0 : 255;
      processed.data[index + 3] = 255;
    }
  }

  processedCtx.putImageData(processed, 0, 0);

  const inputPreviewCanvas = document.createElement("canvas");
  const inputPreviewCtx = inputPreviewCanvas.getContext("2d");
  inputPreviewCanvas.width = outputWidth;
  inputPreviewCanvas.height = outputHeight;
  inputPreviewCtx.fillStyle = "#abff04";
  inputPreviewCtx.fillRect(0, 0, outputWidth, outputHeight);
  inputPreviewCtx.drawImage(inputCanvas, 0, 0);

  return {
    inputCanvas: inputPreviewCanvas,
    processedCanvas,
  };
};

const AirWriting = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handRef = useRef(null);
  const streamRef = useRef(null);
  const ocrWorkerRef = useRef(null);
  const recognitionRunningRef = useRef(false);
  const recognitionTimerRef = useRef(null);
  const lastPlayedGenreRef = useRef(null);
  const lastPlaybackAtRef = useRef(0);

  const [text, setText] = useState("Ready");
  const [detectedWords, setDetectedWords] = useState([]);
  const [ocrStatus, setOcrStatus] = useState("Idle");
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [ocrDebugImage, setOcrDebugImage] = useState("");
  const [ocrProcessedImage, setOcrProcessedImage] = useState("");
  const [rawOcrText, setRawOcrText] = useState("");
  const [normalizedOcrText, setNormalizedOcrText] = useState("");
  const [detectedGenre, setDetectedGenre] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState("Idle");
  const [playerKey, setPlayerKey] = useState(0);
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

  useEffect(() => {
    document.title = "auditorium - air";
  }, []);

  const getOcrWorker = useCallback(async () => {
    if (ocrWorkerRef.current) {
      return ocrWorkerRef.current;
    }

    setOcrStatus("Loading OCR");
    const worker = await Tesseract.createWorker("eng", 1);

    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789- ",
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
      user_defined_dpi: "300",
      preserve_interword_spaces: "1",
    });

    ocrWorkerRef.current = worker;
    return worker;
  }, []);

  const recognizeText = useCallback(async () => {
    const ocrImages = createOcrImages(canvasRef.current);

    if (!ocrImages || recognitionRunningRef.current) {
      if (!ocrImages) {
        setOcrStatus("No ink to scan");
      }
      return;
    }

    recognitionRunningRef.current = true;
    setOcrStatus("Recognizing");
    setOcrDebugImage(ocrImages.inputCanvas.toDataURL("image/png"));
    setOcrProcessedImage(ocrImages.processedCanvas.toDataURL("image/png"));

    try {
      const worker = await getOcrWorker();
      const {
        data: { text: rawText, confidence },
      } = await worker.recognize(ocrImages.processedCanvas);
      const normalizedText = normalizeDetectedText(rawText);
      const roundedConfidence = Math.round(confidence);
      const matchedGenre = matchGenre(normalizedText, roundedConfidence);
      const words = getDisplayTokens(normalizedText);
      const displayWords = words.length > 0
        ? words
        : matchedGenre
          ? [matchedGenre]
          : [];

      setRawOcrText(rawText.trim());
      setNormalizedOcrText(normalizedText);
      setOcrConfidence(roundedConfidence);
      setDetectedGenre(matchedGenre);

      if (displayWords.length > 0) {
        setDetectedWords((currentWords) => {
          const latestWords = displayWords.map((word) => ({
            word,
            confidence: roundedConfidence,
            id: `${word}-${Date.now()}`,
          }));
          const latestWordSet = new Set(displayWords);
          const withoutDuplicates = currentWords.filter(
            (item) => !latestWordSet.has(item.word)
          );

          return [
            ...latestWords,
            ...withoutDuplicates,
          ].slice(0, 12);
        });
        setOcrStatus(
          matchedGenre
            ? "Genre detected"
            : roundedConfidence < OCR_MIN_EXACT_CONFIDENCE
              ? "Low confidence"
              : "Detected text"
        );
      } else {
        setOcrStatus(
          normalizedText ? "Waiting for full word" : "No text found"
        );
      }

      if (matchedGenre) {
        const now = Date.now();
        const isRepeatedGenre = lastPlayedGenreRef.current === matchedGenre;
        const isCoolingDown = now - lastPlaybackAtRef.current < PLAYBACK_COOLDOWN_MS;

        if (isRepeatedGenre && isCoolingDown) {
          setPlaybackStatus("Already playing genre");
          return;
        }

        setPlaybackStatus("Finding song");

        try {
          const song = await fetchGenreVideo(matchedGenre);
          setCurrentSong({
            ...song,
            genre: matchedGenre,
          });
          lastPlayedGenreRef.current = matchedGenre;
          lastPlaybackAtRef.current = now;
          setPlayerKey((key) => key + 1);
          setPlaybackStatus("Autoplay requested");
        } catch (error) {
          console.error("Music lookup failed", error);
          setPlaybackStatus("Music lookup failed");
        }
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
    setOcrStatus("Waiting for pause");
    recognitionTimerRef.current = window.setTimeout(() => {
      recognizeText();
    }, OCR_RECOGNITION_DELAY_MS);
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
    setDetectedWords([]);
    setOcrStatus("Idle");
    setOcrConfidence(null);
    setRawOcrText("");
    setNormalizedOcrText("");
    setDetectedGenre(null);
    setOcrDebugImage("");
    setOcrProcessedImage("");
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
    <div className="relative min-h-screen overflow-auto bg-neutral-950 px-3 py-5 text-white sm:px-4 sm:py-8">
      <div className="fixed right-3 top-3 z-20 sm:right-5">
        <Logout/>
      </div>
      <div className="mx-auto grid w-full max-w-[960px] gap-4 rounded-lg border border-white/15 bg-neutral-900/90 p-3 shadow-2xl sm:p-5 lg:grid-cols-[minmax(0,640px)_280px]">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="hud-panel px-3 py-3 sm:px-4">
              <div className="text-[13px] font-thin tracking-[0.16em] text-white/60">
                auditorium
              </div>
              <div className="mt-2 break-words text-xl font-black uppercase leading-none font-thin text-white">
                {text}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-regular uppercase tracking-[0.10em]">
                <span className="hud-chip text-[7px]">
                  Writing: {hud.writingMode ? "ON" : "OFF"}
                </span>
                <span className="hud-chip text-[7px]">
                  Hand: {hud.handDetected ? "Detected" : "Not Detected"}
                </span>
                <span className="hud-chip text-[7px]">
                  Pinch: {hud.pinchActive ? "Detected" : "Open"}
                </span>
              </div>
            </div>

            <div
              className={`w-full rounded-md border bg-black/60 px-3 py-3 font-mono text-sm sm:min-w-44 sm:w-auto sm:px-4 ${getFpsClass(hud.fps)}`}
            >
              <div>FPS: {hud.fps}</div>
              <div>AVG: {hud.averageFps}</div>
              <div>STATUS: {hud.trackingLost ? "TRACKING LOST" : hud.status.toUpperCase()}</div>
              {/* <div>MISSING: {hud.missingFrames}/{hud.maxMissingFrames}</div> */}
            </div>
          </div>

      
          <div className="air-writing-stage relative aspect-[4/3] w-full max-w-[640px] overflow-hidden rounded-lg border border-white/20 bg-neutral-950">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              width={640}
              height={480}
              className="air-writing-video absolute inset-0 z-[1] h-full w-full scale-x-[-1] object-fill"
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
              className="air-writing-canvas absolute inset-0 z-[2] h-full w-full"
              style={{
                backgroundColor: "transparent",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />
          </div>

          <div className="grid gap-3 sm:flex">
            <button
              className="hud-button w-full sm:w-auto"
              onClick={startWriting}
            >
              Start
            </button>

            <button
              className="hud-button hud-button-danger w-full sm:w-auto"
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

        <aside className="hud-panel flex min-h-0 flex-col px-3 py-4 sm:px-4 lg:min-h-[480px]">
          <div className="text-xs uppercase tracking-[0.16em] text-white/60">
            OCR + Music
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUPPORTED_GENRES.map((genre) => (
              <span
                key={genre}
                className={`hud-chip text-[10px] font-bold uppercase ${
                  detectedGenre === genre ? "border-cyan-300/70 text-purple-500" : "text-white/65"
                }`}
              >
                {genre}
              </span>
            ))}
          </div>
          <div className="mt-2 rounded-md border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs uppercase text-white/70">
            OCR: {ocrStatus}
          </div>
          <div className="mt-2 rounded-md border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs uppercase text-white/70">
            Confidence: {ocrConfidence ?? "--"}%
          </div>
          <div className="mt-2 rounded-md border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs uppercase text-white/70">
            Genre: {detectedGenre || "None"}
          </div>
          <div className="mt-2 rounded-md border border-white/10 bg-black/25 px-3 py-2 font-mono text-xs uppercase text-white/70">
            Playback: {playbackStatus}
          </div>

          {currentSong && (
            <div className="mt-3 rounded-md border border-white/10 bg-black/35 p-2">
              <div className="text-xs uppercase tracking-[0.14em] text-white/50">
                Now Playing
              </div>
              <div className="mt-1 text-sm font-bold text-white">
                {currentSong.title}
              </div>
              <div className="text-xs uppercase text-white/50">
                {currentSong.genre}
              </div>
              <iframe
                key={playerKey}
                title="YouTube music player"
                className="mt-3 aspect-video w-full rounded border border-white/10"
                src={`https://www.youtube.com/embed/${currentSong.id}?autoplay=1&controls=1&rel=0&playsinline=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
              <div className="mt-2 text-[11px] leading-snug text-white/45">
                If autoplay is blocked, click inside the player once. The next OCR match will retry automatically.
              </div>
            </div>
          )}

          <div className="mt-4 text-xs uppercase tracking-[0.16em] text-white/60">
            Detected Words
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

          <div className="mt-4 rounded-md border border-white/10 bg-black/25 p-3">
            <div className="text-xs uppercase tracking-[0.16em] text-white/50">
              OCR Debug
            </div>
            <div className="mt-2 break-words font-mono text-[11px] text-white/55">
              Raw: {rawOcrText || "--"}
            </div>
            <div className="mt-1 break-words font-mono text-[11px] text-white/55">
              Normalized: {normalizedOcrText || "--"}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
              {ocrDebugImage && (
                <div>
                  <div className="mb-1 text-[10px] uppercase text-white/45">
                    Input
                  </div>
                  <img
                    src={ocrDebugImage}
                    alt="OCR cropped input"
                    className="max-h-28 w-full rounded border border-white/10 bg-white object-contain"
                  />
                </div>
              )}
              {ocrProcessedImage && (
                <div>
                  <div className="mb-1 text-[10px] uppercase text-white/45">
                    Processed
                  </div>
                  <img
                    src={ocrProcessedImage}
                    alt="OCR processed black and white input"
                    className="max-h-28 w-full rounded border border-white/10 bg-white object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AirWriting;
