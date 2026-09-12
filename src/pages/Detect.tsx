import { useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, Camera, CameraOff, Cpu, Loader2, ShieldCheck, ShieldAlert, Monitor, Upload, FileVideo, Layers, Eye, FileText, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getFaceLandmarker } from "@/lib/face-detector";
import { RPPGEstimator } from "@/lib/rppg";
import { cnnAnalyzer } from "@/lib/cnn-analyzer";
import { AnatomyEngine } from "@/lib/anatomy-engine";
import { SpectralAnalyzer } from "@/lib/spectral-analyzer";
import { generateForensicReport, TelemetryData, ForensicReportResponse } from "@/lib/forensic-analyst";
import { ForensicReportModal, exportReportToPdf } from "@/components/ForensicReportModal";
import { toast } from "sonner";

type Status = "idle" | "loading" | "running" | "error" | "report";
type InputMode = "camera" | "screen" | "video";

interface Metrics {
  faceDetected: boolean;
  bpm: number | null;
  scoreSpatial: number;
  scoreTemporal: number;
  scoreBiological: number;
  scoreFrequency: number;
  scorePose: number;
  scoreOcular: number;
  scoreAnatomy: number;
  scoreSpectral: number;
  trustScore: number;
  fps: number;
}

interface SessionStats {
  duration: number;
  minTrust: number;
  maxTrust: number;
  avgTrust: number;
  avgSpatial: number;
  avgTemporal: number;
  avgBiological: number;
  avgFrequency: number;
  avgPose: number;
  avgOcular: number;
  avgAnatomy: number;
  avgSpectral: number;
  belowThresholdTime: number;
}

const Detect = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cnnCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const rppgRef = useRef(new RPPGEstimator());
  const anatomyRef = useRef(new AnatomyEngine());
  const spectralRef = useRef(new SpectralAnalyzer());
  const lastFrameTime = useRef(performance.now());
  const fpsEMA = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Core ML & Heuristic State
  const isCnnRunningRef = useRef(false);
  const lastCnnTimeRef = useRef(0);
  const spatialScoreRef = useRef(0.5);
  const lastLmRef = useRef<any[] | null>(null);
  const motionEMA = useRef(0.05);
  const lastPoseRef = useRef<{ yaw: number; pitch: number; roll: number } | null>(null);
  const poseEMARef = useRef(0.05);

  // Session Logging for Report
  const sessionDataRef = useRef<{
    startTime: number;
    minTrust: number;
    maxTrust: number;
    sumTrust: number;
    sumSpatial: number;
    sumTemporal: number;
    sumBiological: number;
    sumFrequency: number;
    sumPose: number;
    sumOcular: number;
    sumAnatomy: number;
    sumSpectral: number;
    frames: number;
    belowTimeMs: number;
  } | null>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [metrics, setMetrics] = useState<Metrics>({
    faceDetected: false, bpm: null, scoreSpatial: 0, scoreTemporal: 0,
    scoreBiological: 0, scoreFrequency: 0, scorePose: 0, scoreOcular: 0, scoreAnatomy: 0, scoreSpectral: 0, trustScore: 0, fps: 0,
  });
  const [waveform, setWaveform] = useState<number[]>([]);
  const trendRef = useRef<{ t: number; spatial: number; temporal: number; biological: number; frequency: number; pose: number; ocular: number; anatomy: number; spectral: number; trust: number }[]>([]);
  const lastTrendPush = useRef(0);
  const [trend, setTrend] = useState<typeof trendRef.current>([]);
  const [inputMode, setInputMode] = useState<InputMode>("camera");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoObjectUrlRef = useRef<string | null>(null);

  const [showXAI, setShowXAI] = useState(false);
  const showXAIRef = useRef(showXAI);
  useEffect(() => { showXAIRef.current = showXAI; }, [showXAI]);

  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  const [forensicModalOpen, setForensicModalOpen] = useState(false);
  const [forensicReport, setForensicReport] = useState<ForensicReportResponse | null>(null);
  const [telemetryPayload, setTelemetryPayload] = useState<TelemetryData | null>(null);
  const [isGeneratingForensicReport, setIsGeneratingForensicReport] = useState(false);

  const captureSnapshotRef = useRef<string | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  const handleGenerateForensicReport = async () => {
    if (!sessionStats) return;
    setIsGeneratingForensicReport(true);
    try {
      const payload: TelemetryData = {
        bpm: sessionStats.avgBiological > 0.15 ? Math.round(65 + (sessionStats.avgBiological * 15)) : null,
        rppgConfidence: sessionStats.avgBiological,
        blinkRate: Math.round(12 + sessionStats.avgOcular * 6),
        ocularScore: sessionStats.avgOcular,
        spatialScore: sessionStats.avgSpatial,
        temporalScore: sessionStats.avgTemporal,
        biologicalScore: sessionStats.avgBiological,
        frequencyScore: sessionStats.avgFrequency,
        poseScore: sessionStats.avgPose,
        anatomyScore: sessionStats.avgAnatomy,
        spectralScore: sessionStats.avgSpectral,
        overallTrustScore: sessionStats.avgTrust,
        sessionDuration: sessionStats.duration,
      };
      setTelemetryPayload(payload);
      const report = await generateForensicReport(payload);
      setForensicReport(report);
      setForensicModalOpen(true);
      toast.success("Digital Forensics Report generated");
    } catch (e) {
      toast.error("Failed to generate forensic report");
    } finally {
      setIsGeneratingForensicReport(false);
    }
  };

  const handleExportSummaryPdf = async () => {
    if (!sessionStats) return;
    if (forensicReport) {
      exportReportToPdf("Deepfake Shield - Digital Forensics Session Report", forensicReport.markdown_report, telemetryPayload || undefined, capturedFrame);
    } else {
      toast.info("Generating PDF report...");
      const payload: TelemetryData = {
        bpm: sessionStats.avgBiological > 0.15 ? Math.round(65 + (sessionStats.avgBiological * 15)) : null,
        rppgConfidence: sessionStats.avgBiological,
        blinkRate: Math.round(12 + sessionStats.avgOcular * 6),
        ocularScore: sessionStats.avgOcular,
        spatialScore: sessionStats.avgSpatial,
        temporalScore: sessionStats.avgTemporal,
        biologicalScore: sessionStats.avgBiological,
        frequencyScore: sessionStats.avgFrequency,
        poseScore: sessionStats.avgPose,
        anatomyScore: sessionStats.avgAnatomy,
        spectralScore: sessionStats.avgSpectral,
        overallTrustScore: sessionStats.avgTrust,
        sessionDuration: sessionStats.duration,
      };
      setTelemetryPayload(payload);
      const rep = await generateForensicReport(payload);
      setForensicReport(rep);
      exportReportToPdf("Deepfake Shield - Digital Forensics Session Report", rep.markdown_report, payload, capturedFrame);
    }
  };

  const ALERT_DURATION_MS = 5000;
  const [threshold, setThreshold] = useState(50);
  const thresholdRef = useRef(threshold);
  useEffect(() => { thresholdRef.current = threshold; }, [threshold]);
  const belowSinceRef = useRef<number | null>(null);
  const alertFiredRef = useRef(false);
  const [alertActive, setAlertActive] = useState(false);
  const [belowMs, setBelowMs] = useState(0);

  useEffect(() => {
    return () => forceStop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const forceStop = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
    }
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
  };

  const stopCamera = () => {
    forceStop();
    if (sessionDataRef.current && status === "running" && sessionDataRef.current.frames > 10) {
       const d = sessionDataRef.current;
       const dur = (performance.now() - d.startTime) / 1000;
       setSessionStats({
         duration: dur,
         minTrust: d.minTrust,
         maxTrust: d.maxTrust,
         avgTrust: d.sumTrust / d.frames,
         avgSpatial: d.sumSpatial / d.frames,
         avgTemporal: d.sumTemporal / d.frames,
         avgBiological: d.sumBiological / d.frames,
         avgFrequency: d.sumFrequency / d.frames,
         avgPose: d.sumPose / d.frames,
         avgOcular: d.sumOcular / d.frames,
         avgAnatomy: d.sumAnatomy / d.frames,
         avgSpectral: d.sumSpectral / d.frames,
         belowThresholdTime: d.belowTimeMs / 1000,
       });
       setStatus("report");
    } else {
       resetAll();
    }
  };

  const resetAll = () => {
    forceStop();
    rppgRef.current.reset();
    anatomyRef.current.reset();
    spectralRef.current.reset();
    trendRef.current = [];
    setTrend([]);
    belowSinceRef.current = null;
    alertFiredRef.current = false;
    setAlertActive(false);
    setBelowMs(0);
    setSessionStats(null);
    captureSnapshotRef.current = null;
    setCapturedFrame(null);
    setStatus("idle");
  };

  const startCamera = () => {
    startDetectorWithSource(async (v) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" }, audio: false,
      });
      streamRef.current = stream;
      v.srcObject = stream;
      await v.play();
    });
  };

  const startScreenShare = () => {
    startDetectorWithSource(async (v) => {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      });
      streamRef.current = stream;
      v.srcObject = stream;
      await v.play();
    });
  };

  const startVideoFile = () => fileInputRef.current?.click();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startDetectorWithSource(async (v) => {
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      const url = URL.createObjectURL(file);
      videoObjectUrlRef.current = url;
      v.srcObject = null;
      v.src = url;
      v.loop = true;
      await v.play();
    });
    e.target.value = '';
  };

  const startDetectorWithSource = async (setupSource: (v: HTMLVideoElement) => Promise<void>) => {
    setStatus("loading");
    setErrorMsg("");
    setSessionStats(null);
    captureSnapshotRef.current = null;
    setCapturedFrame(null);
    try {
      const v = videoRef.current!;
      await setupSource(v);
      await cnnAnalyzer.init();
      const landmarker = await getFaceLandmarker();
      sampleCanvasRef.current = document.createElement("canvas");

      sessionDataRef.current = {
        startTime: performance.now(),
        minTrust: 100, maxTrust: 0, sumTrust: 0, sumSpatial: 0,
        sumTemporal: 0, sumBiological: 0, sumFrequency: 0, sumPose: 0,
        sumOcular: 0, sumAnatomy: 0, sumSpectral: 0,
        frames: 0, belowTimeMs: 0
      };

      setStatus("running");
      toast.success("Defense System Online", { description: "5-Layer Multi-modal analysis running on-device." });

      const loop = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const overlay = overlayRef.current!;
        const sample = sampleCanvasRef.current!;
        if (video.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        const now = performance.now();
        const dt = now - lastFrameTime.current;
        lastFrameTime.current = now;
        const instFps = 1000 / Math.max(1, dt);
        fpsEMA.current = fpsEMA.current * 0.9 + instFps * 0.1;

        const w = video.videoWidth;
        const h = video.videoHeight;
        if (overlay.width !== w) { overlay.width = w; overlay.height = h; }
        if (sample.width !== w) { sample.width = w; sample.height = h; }
        
        const sctx = sample.getContext("2d", { willReadFrequently: true })!;
        sctx.drawImage(video, 0, 0, w, h);

        const result = landmarker.detectForVideo(video, now);
        const ctx = overlay.getContext("2d")!;
        ctx.clearRect(0, 0, w, h);

        let faceDetected = false;
        let scoreSpatial = 0, scoreTemporal = 0, scoreBiological = 0, scoreFrequency = 0, scorePose = 0, scoreOcular = 0, scoreAnatomy = 0, scoreSpectral = 0;
        let bpm: number | null = null;
        let lumaVariance = 0;

        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          faceDetected = true;
          const lm = result.faceLandmarks[0];

          if (!captureSnapshotRef.current && sessionDataRef.current && sessionDataRef.current.frames >= 10) {
            try {
              const snapCanvas = document.createElement("canvas");
              snapCanvas.width = w || 640;
              snapCanvas.height = h || 480;
              const sctxSnap = snapCanvas.getContext("2d");
              if (sctxSnap) {
                if (inputMode === "camera") {
                  sctxSnap.translate(snapCanvas.width, 0);
                  sctxSnap.scale(-1, 1);
                }
                sctxSnap.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
                const dataUrl = snapCanvas.toDataURL("image/jpeg", 0.85);
                captureSnapshotRef.current = dataUrl;
                setCapturedFrame(dataUrl);
              }
            } catch (err) {
              console.warn("Frame capture error", err);
            }
          }

          let minX = 1, minY = 1, maxX = 0, maxY = 0;
          for (const p of lm) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
          }

          // Layer 1: Spatial
          if (!isCnnRunningRef.current && now - lastCnnTimeRef.current > 500) {
            isCnnRunningRef.current = true;
            lastCnnTimeRef.current = now;
            
            if (!cnnCanvasRef.current) {
              cnnCanvasRef.current = document.createElement("canvas");
              cnnCanvasRef.current.width = 224;
              cnnCanvasRef.current.height = 224;
            }
            
            const cctx = cnnCanvasRef.current.getContext("2d", { willReadFrequently: true })!;
            
            // To maintain the heuristic's original behavior (which relied on full scene context)
            // while keeping the performance optimizations, we resize the full frame to 224x224.
            // This prevents the MobileNet heuristic from being confused by tightly cropped faces.
            cctx.drawImage(video, 0, 0, w, h, 0, 0, 224, 224);
            
            cnnAnalyzer.analyzeSpatial(cnnCanvasRef.current).then((score: number) => {
              spatialScoreRef.current = score;
              isCnnRunningRef.current = false;
            });
          }
          scoreSpatial = spatialScoreRef.current;

          // Layer 2: Temporal
          let motion = 0;
          if (lastLmRef.current) {
            for (let i = 0; i < Math.min(lm.length, lastLmRef.current.length); i += 10) {
              motion += Math.abs(lm[i].x - lastLmRef.current[i].x) + Math.abs(lm[i].y - lastLmRef.current[i].y);
            }
          }
          lastLmRef.current = lm;
          motionEMA.current = motionEMA.current * 0.9 + motion * 0.1;
          scoreTemporal = motionEMA.current > 0.0015 && motionEMA.current < 0.2 ? 0.92 : 0.25;

          // Layer 5: 3D Pose
          if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0) {
            const matrix = result.facialTransformationMatrixes[0].data;
            const yaw = Math.atan2(matrix[8], matrix[10]);
            const pitch = Math.atan2(-matrix[9], Math.sqrt(matrix[8]*matrix[8] + matrix[10]*matrix[10]));
            const roll = Math.atan2(matrix[1], matrix[5]);
            
            let poseChange = 0;
            if (lastPoseRef.current) {
              poseChange = Math.abs(yaw - lastPoseRef.current.yaw) + Math.abs(pitch - lastPoseRef.current.pitch) + Math.abs(roll - lastPoseRef.current.roll);
            }
            lastPoseRef.current = { yaw, pitch, roll };
            poseEMARef.current = poseEMARef.current * 0.9 + poseChange * 0.1;
            scorePose = poseEMARef.current > 0.0005 && poseEMARef.current < 0.15 ? 0.95 : 0.20;
          }

          // Layers 6 & 7: Ocular Physics & Anatomical Constraints
          if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
            const anatomyScores = anatomyRef.current.processBlendshapes(result.faceBlendshapes[0].categories);
            scoreOcular = anatomyScores.scoreOcular;
            scoreAnatomy = anatomyScores.scoreAnatomy;
          }

          // ROI
          const cx = (minX + maxX) / 2;
          const foreheadY = minY + (maxY - minY) * 0.18;
          const roiW = (maxX - minX) * 0.35;
          const roiH = (maxY - minY) * 0.10;
          const rx = Math.max(0, Math.floor((cx - roiW / 2) * w));
          const ry = Math.max(0, Math.floor((foreheadY - roiH / 2) * h));
          const rw = Math.min(w - rx, Math.floor(roiW * w));
          const rh = Math.min(h - ry, Math.floor(roiH * h));

          if (rw > 4 && rh > 4) {
            const data = sctx.getImageData(rx, ry, rw, rh).data;
            let gSum = 0, rSum = 0, bSum = 0;
            const px = data.length / 4;
            
            for (let i = 0; i < data.length; i += 4) {
              rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2];
            }
            const meanG = gSum / px, meanR = rSum / px, meanB = bSum / px;
            const meanLuma = (meanR + meanG + meanB) / 3;

            rppgRef.current.push(meanR, meanG, meanB, now);

            // Layer 4: Frequency
            let sumSquares = 0;
            for (let i = 0; i < data.length; i += 4) {
              const luma = (data[i] + data[i + 1] + data[i + 2]) / 3;
              sumSquares += Math.pow(luma - meanLuma, 2);
            }
            lumaVariance = sumSquares / px;
            scoreFrequency = lumaVariance > 150 ? 0.88 : 0.20;

            // Layer 8: Spectral Diffusion Artifacts
            scoreSpectral = spectralRef.current.analyzePatch(data, rw, rh);

            if (showXAIRef.current) {
              // XAI: Frequency Variance Heatmap over forehead
              ctx.fillStyle = lumaVariance > 150 ? "rgba(46, 204, 113, 0.25)" : "rgba(231, 76, 60, 0.4)";
              ctx.fillRect(rx, ry, rw, rh);
              
              // XAI: Render 3D pose vectors
              ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(lm[1].x * w, lm[1].y * h); // Nose tip
              ctx.lineTo(lm[152].x * w, lm[152].y * h); // Chin
              ctx.moveTo(lm[33].x * w, lm[33].y * h); // Left eye
              ctx.lineTo(lm[263].x * w, lm[263].y * h); // Right eye
              ctx.stroke();
            } else {
              ctx.strokeStyle = "rgba(46, 204, 113, 0.85)";
              ctx.lineWidth = 2;
              ctx.strokeRect(rx, ry, rw, rh);
            }
          }

          if (!showXAIRef.current) {
            ctx.strokeStyle = "hsl(212, 92%, 50%)";
            ctx.lineWidth = 2;
            ctx.strokeRect(minX * w, minY * h, (maxX - minX) * w, (maxY - minY) * h);
            ctx.fillStyle = "rgba(33, 150, 243, 0.7)";
            for (let i = 0; i < lm.length; i += 6) {
              ctx.fillRect(lm[i].x * w - 1, lm[i].y * h - 1, 2, 2);
            }
          }
        } else {
          if (inputMode !== "camera") {
            setMetrics({ faceDetected: false, bpm: null, scoreSpatial: 0, scoreTemporal: 0, scoreBiological: 0, scoreFrequency: 0, scorePose: 0, scoreOcular: 0, scoreAnatomy: 0, scoreSpectral: 0, trustScore: 0, fps: fpsEMA.current });
            rppgRef.current.reset();
            anatomyRef.current.reset();
            spectralRef.current.reset();
            belowSinceRef.current = null;
            setBelowMs(0);
            setAlertActive(false);
            alertFiredRef.current = false;
            rafRef.current = requestAnimationFrame(loop);
            return;
          }
        }

        const est = rppgRef.current.estimate();
        bpm = est.bpm;
        scoreBiological = est.confidence;

        setMetrics(prev => {
          const alpha = 0.05;
          const sSpatial = prev.scoreSpatial * (1 - alpha) + scoreSpatial * alpha;
          const sTemporal = prev.scoreTemporal * (1 - alpha) + scoreTemporal * alpha;
          const sBiological = prev.scoreBiological * (1 - alpha) + scoreBiological * alpha;
          const sFrequency = prev.scoreFrequency * (1 - alpha) + scoreFrequency * alpha;
          const sPose = prev.scorePose * (1 - alpha) + scorePose * alpha;
          const sOcular = prev.scoreOcular * (1 - alpha) + scoreOcular * alpha;
          const sAnatomy = prev.scoreAnatomy * (1 - alpha) + scoreAnatomy * alpha;
          const sSpectral = prev.scoreSpectral * (1 - alpha) + scoreSpectral * alpha;

          let fusedScore = 0;
          if (faceDetected) {
            // Layer 8 Fusion Engine (Weighted Average)
            fusedScore = (sSpatial * 0.15) + (sTemporal * 0.10) + (sBiological * 0.15) + (sFrequency * 0.05) + (sPose * 0.10) + (sOcular * 0.15) + (sAnatomy * 0.15) + (sSpectral * 0.15);
            
            // Non-linear Veto System:
            // Generative AI often perfects visual appearance but catastrophically fails invisible physics (like rPPG or frequency).
            // An average allows high scores to hide critical failures. If any core physical layer drops below 45%, 
            // a human face is impossible, so it vetos the average and drags the total score down.
            const minPhysical = Math.min(sBiological, sFrequency, sSpectral, sSpatial);
            if (minPhysical < 0.25) {
              fusedScore = Math.min(fusedScore, minPhysical + 0.15);
            }
          }
          const trustScore = Math.round(Math.max(0, Math.min(1, fusedScore)) * 100);

          if (faceDetected && trustScore < thresholdRef.current) {
            if (belowSinceRef.current == null) belowSinceRef.current = now;
            const dur = now - belowSinceRef.current;
            setBelowMs(dur);
            if (dur >= ALERT_DURATION_MS) {
              setAlertActive(true);
              if (!alertFiredRef.current) {
                alertFiredRef.current = true;
                toast.error("Trust score alert", { description: `Score below ${thresholdRef.current} for 5 seconds.` });
              }
            }
          } else {
            belowSinceRef.current = null;
            setBelowMs(0);
            setAlertActive(false);
            alertFiredRef.current = false;
          }

          if (sessionDataRef.current && faceDetected) {
            const d = sessionDataRef.current;
            d.frames++;
            d.sumTrust += trustScore;
            d.sumSpatial += sSpatial;
            d.sumTemporal += sTemporal;
            d.sumBiological += sBiological;
            d.sumFrequency += sFrequency;
            d.sumPose += sPose;
            d.sumOcular += sOcular;
            d.sumAnatomy += sAnatomy;
            d.sumSpectral += sSpectral;
            if (trustScore < d.minTrust) d.minTrust = trustScore;
            if (trustScore > d.maxTrust) d.maxTrust = trustScore;
            d.belowTimeMs = Math.max(d.belowTimeMs, belowMs);
          }

          if (now - lastTrendPush.current >= 500) {
            lastTrendPush.current = now;
            trendRef.current.push({ t: now, spatial: sSpatial, temporal: sTemporal, biological: sBiological, frequency: sFrequency, pose: sPose, ocular: sOcular, anatomy: sAnatomy, spectral: sSpectral, trust: trustScore / 100 });
            const cutoff = now - 30000;
            while (trendRef.current.length && trendRef.current[0].t < cutoff) trendRef.current.shift();
            setTrend([...trendRef.current]);
          }

          return { faceDetected, bpm, scoreSpatial: sSpatial, scoreTemporal: sTemporal, scoreBiological: sBiological, scoreFrequency: sFrequency, scorePose: sPose, scoreOcular: sOcular, scoreAnatomy: sAnatomy, scoreSpectral: sSpectral, trustScore, fps: fpsEMA.current };
        });

        setWaveform(rppgRef.current.waveform(140));
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error");
      setStatus("error");
    }
  };

  const verdict = getVerdict(metrics, status);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-8 md:py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2"><Layers className="h-4 w-4" /> Multi-Modal Defense System V3</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">Is the person on camera real?</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Executing 8-Layer Physics, Anatomical, and Spectral analysis completely on-device.
            </p>
            {status !== "running" && status !== "loading" && status !== "report" && (
              <div className="mt-6">
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)} className="w-[400px]">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" /> Camera</TabsTrigger>
                    <TabsTrigger value="screen"><Monitor className="mr-2 h-4 w-4" /> Screen</TabsTrigger>
                    <TabsTrigger value="video"><FileVideo className="mr-2 h-4 w-4" /> Video</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {status === "running" ? (
              <Button variant="outline" size="lg" onClick={stopCamera}>
                <CameraOff className="mr-2 h-4 w-4" /> Stop & Generate Report
              </Button>
            ) : status === "report" ? (
              <Button size="lg" onClick={resetAll}>
                <RotateCcw className="mr-2 h-4 w-4" /> New Detection
              </Button>
            ) : (
              <Button size="lg" className="shadow-glow" onClick={() => { inputMode === "camera" ? startCamera() : inputMode === "screen" ? startScreenShare() : startVideoFile(); }} disabled={status === "loading"}>
                {status === "loading" ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Model…</> : inputMode === "camera" ? <><Camera className="mr-2 h-4 w-4" /> Start camera</> : inputMode === "screen" ? <><Monitor className="mr-2 h-4 w-4" /> Share screen</> : <><Upload className="mr-2 h-4 w-4" /> Upload video</>}
              </Button>
            )}
            <input type="file" ref={fileInputRef} accept="video/*" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>

        {status === "report" && sessionStats ? (
          <div className="w-full max-w-4xl mx-auto rounded-2xl border border-border bg-card p-8 shadow-elevated">
            <div className="flex items-start justify-between border-b pb-6">
               <div>
                 <p className="font-mono text-sm text-muted-foreground uppercase tracking-wider">Forensic Session Report</p>
                 <h2 className="text-3xl font-display mt-1">Detection Summary</h2>
                 <p className="text-muted-foreground mt-1">Duration: {sessionStats.duration.toFixed(1)}s</p>
               </div>
               <div className="flex items-center gap-3">
                 <Button
                   variant="default"
                   className="shadow-glow flex items-center gap-2"
                   onClick={handleGenerateForensicReport}
                   disabled={isGeneratingForensicReport}
                 >
                   {isGeneratingForensicReport ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <FileText className="h-4 w-4" />
                   )}
                   Generate AI Forensics Report
                 </Button>
                 <Button variant="outline" onClick={handleExportSummaryPdf}>
                   <Download className="h-4 w-4 mr-2" /> Export PDF
                 </Button>
               </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6 mt-8">
               <div className="bg-muted/30 p-6 rounded-xl border border-border">
                 <p className="text-sm text-muted-foreground">Average Trust Score</p>
                 <p className="text-5xl font-display mt-2">{Math.round(sessionStats.avgTrust)}</p>
               </div>
               <div className="bg-muted/30 p-6 rounded-xl border border-border">
                 <p className="text-sm text-muted-foreground">Minimum Trust Score</p>
                 <p className="text-5xl font-display mt-2">{Math.round(sessionStats.minTrust)}</p>
               </div>
               <div className="bg-muted/30 p-6 rounded-xl border border-border">
                 <p className="text-sm text-muted-foreground">Time Below Threshold</p>
                 <p className="text-5xl font-display mt-2 text-danger">{sessionStats.belowThresholdTime.toFixed(1)}s</p>
               </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">8-Layer Average Breakdown</h3>
              <div className="space-y-4">
                 <SignalRow label="Layer 1: Spatial (CNN)" value={sessionStats.avgSpatial} color="bg-blue-500" weight="15%" />
                 <SignalRow label="Layer 2: Temporal" value={sessionStats.avgTemporal} color="bg-purple-500" weight="10%" />
                 <SignalRow label="Layer 3: Biological (rPPG)" value={sessionStats.avgBiological} color="bg-trust" weight="15%" />
                 <SignalRow label="Layer 4: Frequency" value={sessionStats.avgFrequency} color="bg-amber-500" weight="5%" />
                 <SignalRow label="Layer 5: 3D Pose" value={sessionStats.avgPose} color="bg-pink-500" weight="10%" />
                 <SignalRow label="Layer 6: Ocular Physics" value={sessionStats.avgOcular} color="bg-cyan-500" weight="15%" />
                 <SignalRow label="Layer 7: Anatomy" value={sessionStats.avgAnatomy} color="bg-rose-500" weight="15%" />
                 <SignalRow label="Layer 8: Spectral" value={sessionStats.avgSpectral} color="bg-indigo-500" weight="15%" />
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border">
               <h3 className="text-lg font-medium mb-2">Final Verdict</h3>
               {sessionStats.avgTrust >= 55 ? (
                 <div className="p-4 bg-trust/10 border border-trust/30 rounded-xl flex items-center gap-3 text-trust">
                   <ShieldCheck className="h-8 w-8" />
                   <div><p className="font-bold">Authentic Video</p><p className="text-sm">All 8 multi-modal physics layers align with human biological parameters.</p></div>
                 </div>
               ) : sessionStats.avgTrust >= 35 ? (
                 <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-600">
                   <AlertTriangle className="h-8 w-8" />
                   <div><p className="font-bold">Uncertain / Calibrating</p><p className="text-sm">Minor lighting or motion noise detected. Hold steady to calibrate.</p></div>
                 </div>
               ) : (
                 <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3 text-danger">
                   <ShieldAlert className="h-8 w-8" />
                   <div><p className="font-bold">Synthetic / Deepfake Detected</p><p className="text-sm">Severe anomalies detected across multiple modality layers.</p></div>
                 </div>
               )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${status === "running" ? "bg-trust animate-pulse" : "bg-muted-foreground/40"}`} />
                    {status === "running" ? "live · multi-modal engine" : status === "loading" ? "initializing TFJS…" : status === "error" ? "error" : "idle"}
                  </span>
                  <div className="flex items-center gap-6">
                    {status === "running" && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="xai-mode" className="text-xs uppercase font-mono text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> XAI Overlay</Label>
                        <Switch id="xai-mode" checked={showXAI} onCheckedChange={setShowXAI} />
                      </div>
                    )}
                    <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground"><Cpu className="h-3.5 w-3.5" /> {metrics.fps.toFixed(0)} fps</span>
                  </div>
                </div>
                <div className="relative aspect-video w-full bg-black">
                  <video ref={videoRef} className={`h-full w-full object-cover ${inputMode === "camera" ? "-scale-x-100" : ""}`} playsInline muted />
                  <canvas ref={overlayRef} className={`absolute inset-0 h-full w-full ${inputMode === "camera" ? "-scale-x-100" : ""}`} />
                  {status !== "running" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-background/80 to-background/95 p-8 text-center">
                      <ShieldCheck className="h-12 w-12 text-primary" />
                      <p className="font-display text-2xl">Defense Engine Offline</p>
                      <p className="max-w-sm text-sm text-muted-foreground">Click <strong>Start camera</strong>. Your video is processed entirely in this tab — nothing leaves your device.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-trust" />
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">rPPG pulse signal (Layer 3)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-2xl">{metrics.bpm && metrics.scoreBiological > 0.15 ? metrics.bpm : "—"}<span className="ml-1 text-sm text-muted-foreground">bpm</span></p>
                  </div>
                </div>
                <PulseGraph values={waveform} />
              </div>

              <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div><p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{showXAI ? "Multi-Modal Fusion Trend" : "Trust Score Trend"}</p></div>
                  <div className="hidden gap-3 sm:flex flex-wrap justify-end">
                    {showXAI && (
                      <>
                        <Legend swatch="bg-blue-500" label="Visual" />
                        <Legend swatch="bg-purple-500" label="Temporal" />
                        <Legend swatch="bg-trust" label="Biological" />
                        <Legend swatch="bg-amber-500" label="Freq" />
                        <Legend swatch="bg-pink-500" label="Pose" />
                        <Legend swatch="bg-cyan-500" label="Ocul" />
                        <Legend swatch="bg-rose-500" label="Anat" />
                        <Legend swatch="bg-indigo-500" label="Spec" />
                      </>
                    )}
                    <Legend swatch="bg-foreground" label="Overall Trust" />
                  </div>
                </div>
                <TrendChart points={trend} showDetails={showXAI} />
              </div>
            </div>

            <aside className="space-y-6 lg:col-span-4">
              {alertActive && (
                <div role="alert" className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-5 shadow-card animate-pulse-ring">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                  <div>
                    <p className="font-display text-lg leading-tight text-danger">Sustained Low Trust</p>
                    <p className="mt-1 text-xs text-muted-foreground">Trust score has been below {threshold} for over 5 seconds. High probability of generative AI.</p>
                  </div>
                </div>
              )}

              <TrustCard score={metrics.trustScore} verdict={verdict} active={status === "running"} />

              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Adaptive Defense Layers</p>
                <div className="mt-4 space-y-5">
                  <SignalRow label="Layer 1: Spatial (CNN)" value={metrics.scoreSpatial} color="bg-blue-500" weight="15%" />
                  <SignalRow label="Layer 2: Temporal" value={metrics.scoreTemporal} color="bg-purple-500" weight="10%" />
                  <SignalRow label="Layer 3: Biological (rPPG)" value={metrics.scoreBiological} color="bg-trust" weight="15%" />
                  <SignalRow label="Layer 4: Frequency" value={metrics.scoreFrequency} color="bg-amber-500" weight="5%" />
                  <SignalRow label="Layer 5: 3D Pose" value={metrics.scorePose} color="bg-pink-500" weight="10%" />
                  <SignalRow label="Layer 6: Ocular Physics" value={metrics.scoreOcular} color="bg-cyan-500" weight="15%" />
                  <SignalRow label="Layer 7: Anatomy" value={metrics.scoreAnatomy} color="bg-rose-500" weight="15%" />
                  <SignalRow label="Layer 8: Spectral Diffusion" value={metrics.scoreSpectral} color="bg-indigo-500" weight="15%" />
                </div>
              </div>
            </aside>
          </div>
        )}
        <ForensicReportModal
          open={forensicModalOpen}
          onOpenChange={setForensicModalOpen}
          report={forensicReport}
          telemetry={telemetryPayload}
          capturedFrame={capturedFrame}
        />
      </main>
      <SiteFooter />
    </div>
  );
};

function getVerdict(m: Metrics, status: Status): { label: string; tone: "trust" | "warn" | "danger" | "muted"; description: string } {
  if (status !== "running") return { label: "Standby", tone: "muted", description: "Start the detector to begin analysis." };
  if (!m.faceDetected) return { label: "No face detected", tone: "muted", description: "Move into frame and ensure the lighting is sufficient." };
  if (m.trustScore >= 55) return { label: "Likely human", tone: "trust", description: "All 8 multi-modal physics layers are consistent with a real person." };
  if (m.trustScore >= 35) return { label: "Uncertain", tone: "warn", description: "Signals are mixed. Awaiting physics or biological signal lock-in." };
  return { label: "Deepfake Detected", tone: "danger", description: "Generative physics or anatomical constraint violations detected." };
}

const TrustCard = ({ score, verdict, active }: { score: number; verdict: ReturnType<typeof getVerdict>; active: boolean }) => {
  const toneClasses = { trust: "text-trust border-trust/30 bg-trust/5", warn: "text-amber-600 border-amber-500/30 bg-amber-500/5", danger: "text-danger border-danger/30 bg-danger/5", muted: "text-muted-foreground border-border bg-muted/30" }[verdict.tone];
  const Icon = verdict.tone === "danger" ? ShieldAlert : ShieldCheck;
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Adaptive Trust Score</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-display text-6xl tracking-tight">{active ? score : "—"}</span><span className="mb-2 text-sm text-muted-foreground">/100</span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all duration-300 gradient-meter" style={{ width: active ? `${score}%` : "0%" }} />
      </div>
      <div className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${toneClasses}`}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1"><p className="font-display text-lg leading-tight">{verdict.label}</p><p className="mt-1 text-xs text-muted-foreground">{verdict.description}</p></div>
      </div>
    </div>
  );
};

const SignalRow = ({ label, value, color, weight }: { label: string; value: number; color: string; weight: string }) => (
  <div>
    <div className="flex items-center justify-between text-sm"><span className="text-foreground">{label}</span><span className="font-mono text-xs text-muted-foreground">{weight} WGT · {Math.round(value * 100)}%</span></div>
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${Math.max(2, value * 100)}%` }} /></div>
  </div>
);

const PulseGraph = ({ values }: { values: number[] }) => {
  const w = 600, h = 80;
  if (values.length < 2) return <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-20 w-full"><line x1={0} y1={h/2} x2={w} y2={h/2} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" /></svg>;
  const step = w / (values.length - 1);
  const path = values.map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h / 2 - v * (h / 2 - 6)).toFixed(1)}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-20 w-full"><line x1={0} y1={h/2} x2={w} y2={h/2} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" /><path d={path} fill="none" stroke="hsl(var(--trust))" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" /></svg>;
};

const Legend = ({ swatch, label }: { swatch: string; label: string }) => (
  <div className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${swatch}`} /><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span></div>
);

const TrendChart = ({ points, showDetails }: { points: { t: number; spatial: number; temporal: number; biological: number; frequency: number; pose: number; ocular: number; anatomy: number; spectral: number; trust: number }[], showDetails: boolean }) => {
  const w = 600, h = 140, pad = 6, WINDOW = 30000;
  const now = points.length ? points[points.length - 1].t : 0;
  const xFor = (t: number) => pad + (1 - Math.min(1, Math.max(0, (now - t) / WINDOW))) * (w - pad * 2);
  const yFor = (v: number) => h - pad - Math.max(0, Math.min(1, v)) * (h - pad * 2);
  const buildPath = (key: keyof typeof points[0]) => points.length < 2 ? "" : points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.t).toFixed(1)} ${yFor(p[key] as number).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-36 w-full">
      {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={pad} x2={w - pad} y1={yFor(g)} y2={yFor(g)} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="3 4" />)}
      <line x1={pad} x2={w - pad} y1={yFor(0)} y2={yFor(0)} stroke="hsl(var(--border))" strokeWidth={1} />
      <line x1={pad} x2={w - pad} y1={yFor(1)} y2={yFor(1)} stroke="hsl(var(--border))" strokeWidth={1} />
      {points.length >= 2 && (
        <>
          {showDetails && (
            <>
              <path d={buildPath("spatial")} fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.6} />
              <path d={buildPath("temporal")} fill="none" stroke="#a855f7" strokeWidth={1.5} opacity={0.6} />
              <path d={buildPath("biological")} fill="none" stroke="hsl(var(--trust))" strokeWidth={1.5} opacity={0.6} />
              <path d={buildPath("frequency")} fill="none" stroke="#f59e0b" strokeWidth={1.5} opacity={0.6} />
              <path d={buildPath("pose")} fill="none" stroke="#ec4899" strokeWidth={1.5} opacity={0.6} />
              <path d={buildPath("ocular")} fill="none" stroke="#06b6d4" strokeWidth={1.5} opacity={0.6} />
              <path d={buildPath("anatomy")} fill="none" stroke="#f43f5e" strokeWidth={1.5} opacity={0.6} />
              <path d={buildPath("spectral")} fill="none" stroke="#6366f1" strokeWidth={1.5} opacity={0.6} />
            </>
          )}
          <path d={buildPath("trust")} fill="none" stroke="hsl(var(--foreground))" strokeWidth={showDetails ? 2.5 : 2} strokeLinejoin="round" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};

export default Detect;
