# Deepfake Shield — Comprehensive Project Audit & Technical Evaluation

**Date:** September 22, 2026  
**Project:** Deepfake Shield (Browser-based Real-time Multi-Modal Deepfake Defense & Forensics)  
**Corpus / Path:** `d:/human-or-bot-shield-main/Deepfakeshield`

---

## Executive Summary

**Deepfake Shield** is designed as a browser-based Progressive Web Application (PWA) for real-time deepfake detection using visual inference, facial landmark tracking, remote photoplethysmography (rPPG), and multi-modal trust scoring. 

The current codebase is a well-structured **React 18 + Vite + TypeScript** single-page application equipped with an interactive dashboard, client-side MediaPipe landmark extraction, rPPG pulse estimation, an 8-layer heuristic trust fusion engine, and an automated digital forensics report generator (with PDF export).

However, **the codebase lacks a true, trained deepfake detection AI model**. The "Spatial CNN" module currently loads generic MobileNet v2 (trained on ImageNet) and applies an arbitrary formula (`1.2 - probability_sum`), while the remaining 7 layers rely on manual geometric/pixel heuristics. Furthermore, PWA offline capabilities (service worker, web manifest) and WebGPU backends are claimed in the documentation/UI but missing in implementation.

---

## A. Architecture

```
                                  +------------------------------------+
                                  |  Video Input Stream                |
                                  |  (Webcam / Screen Share / Video)   |
                                  +-----------------+------------------+
                                                    |
                                                    v
                                  +-----------------+------------------+
                                  |  HTML Canvas Frame Grabber        |
                                  +-----------------+------------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
                         v                                                     v
      +------------------+------------------+               +------------------+------------------+
      |  MediaPipe FaceLandmarker WASM      |               |  TensorFlow.js (WebGL / CPU)         |
      |  (478 3D Landmarks & Blendshapes)   |               |  MobileNet v2 (Generic Spatial)     |
      +------------------+------------------+               +------------------+------------------+
                         |                                                     |
        +----------------+----------------+                                    |
        |                |                |                                    |
        v                v                v                                    v
  +-----+-----+    +-----+-----+    +-----+-----+                        +-----+-----+
  | Layer 2   |    | Layers 5  |    | Layer 3   |                        | Layer 1   |
  | Temporal  |    | 3D Pose & |    | rPPG Skin |                        | Spatial   |
  | Motion    |    | Anatomy   |    | ROI Pulse |                        | CNN       |
  +-----+-----+    +-----+-----+    +-----+-----+                        +-----+-----+
        |                |                |                                    |
        +----------------+----------------+------------------------------------+
                                                  |
                                                  v
                                  +---------------+---------------+
                                  |  8-Layer Fusion & Veto Engine |
                                  |  (Weighted Avg + Min Penalty) |
                                  +---------------+---------------+
                                                  |
                                                  v
                                  +---------------+---------------+
                                  | Adaptive Trust Score (0-100)  |
                                  | Verdict (REAL / UNCERTAIN /   |
                                  | DEEPFAKE)                     |
                                  +---------------+---------------+
                                                  |
                                                  v
                                  +---------------+---------------+
                                  | Forensic Report Generator     |
                                  | & Interactive UI Dashboard    |
                                  +-------------------------------+
```

### Architectural Highlights
- **100% Client-Side Processing:** All frame capture, MediaPipe tracking, rPPG signal extraction, and scoring occur inside the browser canvas loop.
- **Local Model Assets:** MediaPipe WASM binaries (`/public/wasm/*`) and face landmarker model (`/public/models/face_landmarker.task`) are self-hosted in `public/`.
- **Modularity:** Separate modules for landmarking (`face-detector.ts`), pulse processing (`rppg.ts`), spatial feature heuristic (`cnn-analyzer.ts`), anatomical constraints (`anatomy-engine.ts`), high-frequency noise analysis (`spectral-analyzer.ts`), and forensic reporting (`forensic-analyst.ts`).

---

## B. Components & Key Files

| Module / Component | Path | Description |
| :--- | :--- | :--- |
| **Frontend Entry** | `src/main.tsx`, `src/App.tsx` | React 18 application root, TanStack Query provider, Sonner toast notifications, React Router. |
| **Detection Dashboard** | `src/pages/Detect.tsx` | Real-time video processing loop (`requestAnimationFrame`), MediaPipe landmark integration, ROI canvas extraction, live metrics state management, pulse waveform rendering, and session statistical aggregation. |
| **Landing Page** | `src/pages/Index.tsx` | Informational landing page detailing architecture, features, and zero-leak privacy guarantee. |
| **Face Landmarker** | `src/lib/face-detector.ts` | Async loader for `@mediapipe/tasks-vision` loading local WASM binaries and `face_landmarker.task`. GPU delegate with CPU fallback. |
| **rPPG Estimator** | `src/lib/rppg.ts` | Remote photoplethysmography pulse engine. Collects forehead skin ROI RGB values, applies POS/CHROM noise subtraction (`gNorm - rNorm`), 1.5s moving average high-pass filter, Hann windowing, and Goertzel frequency scanning (45–180 BPM). |
| **Spatial CNN Analyzer** | `src/lib/cnn-analyzer.ts` | TensorFlow.js MobileNet v2 wrapper. Attempts WebGL backend then CPU fallback. Runs image classification on canvas frames. |
| **Anatomy & Ocular Engine** | `src/lib/anatomy-engine.ts` | Evaluates 52 MediaPipe blendshapes against rules for blink asymmetry (ocular physics), smile vs. cheek squint inconsistency, jaw open vs. mouth close violations, and strabismus eye gaze divergence. |
| **Spectral Analyzer** | `src/lib/spectral-analyzer.ts` | Calculates 1st and 2nd spatial derivatives (Laplacian filter) over skin patches to detect unnatural high-frequency periodic checkerboard artifacts or plastic skin smoothing. |
| **Forensic Analyst Engine** | `src/lib/forensic-analyst.ts` | Rule-based engine that evaluates session telemetry against biological human baselines and generates formatted Markdown reports (with optional Gemini LLM endpoint support). |
| **Forensic Report Modal** | `src/components/ForensicReportModal.tsx` | Modal UI displaying captured subject frame, rPPG pulse SVG, 8-layer horizontal bar charts, Markdown report, copy to clipboard, and print-ready PDF exporter. |

---

## C. Models

1. **Face Detection & Facial Landmarks:**
   - **Model:** `@mediapipe/tasks-vision` FaceLandmarker asset (`face_landmarker.task`).
   - **Outputs:** 478 3D facial landmarks, 52 facial blendshapes, 4x4 3D transformation matrices.
   - **Execution:** WebAssembly + WebGL GPU acceleration.

2. **Visual Deepfake Classifier (Spatial CNN):**
   - **Model:** `@tensorflow-models/mobilenet` (v2, alpha 0.5).
   - **Reality Check:** **This is NOT a deepfake detection model.** MobileNet v2 was trained on general ImageNet categories (dog, car, chair, etc.). The code classifies video frames against 1,000 generic object categories, sums top probabilities, and computes `1.2 - confidenceSum`.
   - **Status:** **Placeholder / Dummy Heuristic.** A genuine binary deepfake detection CNN (e.g., trained on MesoNet, EfficientNet-B0, or Xception on FaceForensics++) is missing.

3. **Other Defense Layers (Layers 2-8):**
   - Purely algorithm- or rule-based heuristics operating on landmarks, pixel gradients, ROI mean color, and blendshapes. No neural net models are used for these layers.

---

## D. Data Flow

```
1. Video Input (Camera / Screen Share / Video File)
       │
       ▼
2. HTML5 <video> Element ──► Canvas Context (2D)
       │
       ├──► MediaPipe FaceLandmarker (WASM) ──► 478 Landmarks + 52 Blendshapes
       │                                              │
       │                                              ├──► Layer 2 (Temporal Motion EMA)
       │                                              ├──► Layer 5 (3D Pose Matrix)
       │                                              └──► Layers 6 & 7 (Ocular & Anatomy Blendshape Rules)
       │
       ├──► Skin ROI Extraction (Forehead / Cheek)
       │         │
       │         ├──► Layer 3: rPPG Estimator (POS/CHROM -> HPF -> Goertzel FFT -> BPM & Conf)
       │         ├──► Layer 4: Micro-Color Luma Variance
       │         └──► Layer 8: Spectral Analyzer (Spatial 2nd Derivatives)
       │
       └──► Layer 1: Spatial CNN (MobileNet v2 Canvas Classification -> Heuristic Probability Inverse)
       │
       ▼
3. Multi-Modal Fusion Engine
       ├──► Weighted Sum: S1(15%) + S2(10%) + S3(15%) + S4(5%) + S5(10%) + S6(15%) + S7(15%) + S8(15%)
       ├──► Non-Linear Veto: If min(Biological, Frequency, Spectral, Spatial) < 0.25, cap max score.
       └──► Output: Adaptive Trust Score (0 - 100)
       │
       ▼
4. UI & Forensics Output
       ├──► Live Trust Gauge, Signal Progress Bars, Pulse Waveform SVG Chart
       ├──► Low Trust Alert (toast notification if score < threshold for > 5s)
       └──► Session Summary & Forensic Markdown / PDF Report Exporter
```

---

## E. Current Functionality (Verified Working)

- [x] **Project Build & Dev Server:** Builds cleanly (`vite build` -> 17.89s) and runs without errors.
- [x] **UI & Navigation:** Responsive, modern dark UI using shadcn/ui, Radix UI primitives, Tailwind CSS, Lucide icons, and Recharts.
- [x] **Video Capture Sources:** Supports live Webcam (`getUserMedia`), Screen Sharing (`getDisplayMedia`), and local Video File upload (`URL.createObjectURL`).
- [x] **Facial Landmark Detection:** Real-time 478 3D landmark overlay and bounding box rendering via MediaPipe WASM.
- [x] **rPPG Pulse Estimation:** Real-time skin ROI extraction, POS color filtering, Goertzel BPM estimation, and live pulse graph SVG rendering.
- [x] **Multi-Modal Trust Score Engine:** Computes fused 8-layer score, applies non-linear physical layer vetoes, and updates UI gauges dynamically.
- [x] **XAI Overlay Mode:** Toggleable visual overlay rendering 3D pose vectors and forehead frequency heatmaps.
- [x] **Digital Forensics Report Generator:** Creates deterministic clinical Markdown reports based on session statistics and exports clean PDF documents.
- [x] **Automated Testing:** Vitest unit test suite (`npm test`) passes with 3/3 tests green.

---

## F. Missing Functionality & Gaps

1. **No Genuine Deepfake Neural Model:**
   - The spatial analyzer uses ImageNet MobileNet v2 with a mock calculation (`1.2 - confidenceSum`). There is no fine-tuned or custom-trained deepfake detection model (e.g., EfficientNet, MesoNet, MobileNet trained on Deepfake benchmarks).
2. **Missing PWA Configuration:**
   - No `manifest.json` or `manifest.webmanifest`.
   - No Service Worker (`sw.js`) or offline caching.
   - `vite-plugin-pwa` is not installed or configured in `vite.config.ts`.
3. **No WebGPU Backend:**
   - Documented as using WebGPU, but `@tensorflow/tfjs-backend-webgpu` is missing from `package.json`. TensorFlow.js uses WebGL with CPU fallback.
4. **No Deepfake Dataset / Evaluation Benchmark Script:**
   - No sample test videos (authentic vs. fake) are included in the repository.
   - No evaluation harness to calculate accuracy, ROC-AUC, EER, Precision, or Recall against standard datasets (e.g., FaceForensics++, Celeb-DF, DFDC).
5. **Heuristic Fragility:**
   - Layers 2, 4, 5, 6, 7, and 8 rely on hardcoded thresholds (e.g., motion thresholds, luma variance boundaries) that have not been validated or calibrated against empirical ground truth datasets.

---

## G. Existing Bugs & Technical Issues

1. **`cnn-analyzer.ts` Deferred Fallback:** If MobileNet deferred load returns default `0.85`, or if WebGL fails on initial frame, spatial trust defaults to fixed numbers without warning.
2. **Title & Naming Mismatch in `package.json`:** `package.json` retains the boilerplate name `"vite_react_shadcn_ts"` instead of `"deepfake-shield"`.
3. **Chunk Size Warning during Build:** Main bundle `index-DgmOt4jH.js` is 2.55 MB (exceeds Vite 500 kB chunk warning threshold due to bundled TensorFlow.js and UI libraries). Dynamic imports / manual chunk splitting are needed.
4. **Hardcoded Synthetic Frame Capture Placeholder:** `ForensicReportModal.tsx` falls back to a static missing file path `/telemetry_scan.png` if a live frame wasn't captured in time.

---

## H. Existing Evaluation Capability

- **Unit Tests:** 2 test files (`example.test.ts` and `forensic-analyst.test.ts`) using Vitest, validating basic report output format and string matching.
- **Quantitative Evaluation:** **None.** No dataset benchmark scripts, no confusion matrix generation, no ROC/AUC metric calculations.

---

## I. Existing Deployment Configuration

- **Vercel Configuration:** `vercel.json` contains SPA route rewrite rule (`/(.*) -> /index.html`) and HTTP caching headers (`Cache-Control: public, max-age=31536000, immutable`) for static `/wasm/` and `/models/` assets.
- **Production Build:** Standard Vite static bundle (`dist/`).

---

## J. Recommended Next Phase Implementation Plan

### Phase 1: Real Deepfake Model Integration
- Replace MobileNet v2 ImageNet classifier with a lightweight, browser-optimized MobileNetV3 / EfficientNet-Lite binary deepfake classifier trained on FaceForensics++ / Celeb-DF, converted to TensorFlow.js GraphModel (`model.json` + bin weights).

### Phase 2: Complete PWA Implementation
- Install `vite-plugin-pwa`.
- Create web app manifest (`manifest.json`) with app icons, theme colors, display modes, and register a service worker for full offline capability.

### Phase 3: Benchmark & Evaluation Suite
- Add sample authentic and deepfake test videos in an `evaluation/samples/` folder.
- Create a dedicated CLI evaluation script (`scripts/evaluate.ts` or Python evaluation harness) to run inference across video samples and output Quantitative Evaluation Metrics (Accuracy, AUC-ROC, EER, False Acceptance Rate, False Rejection Rate).

### Phase 4: Performance & WebGPU Optimization
- Code-split heavy dependencies (`@tensorflow/tfjs`, `@mediapipe/tasks-vision`, `recharts`) using Rollup `manualChunks`.
- (Optional) Integrate `@tensorflow/tfjs-backend-webgpu` for accelerated WebGPU execution on supported devices.

---

## Verification Matrix

| Task / Item | Status | Result / Notes |
| :--- | :---: | :--- |
| **Build Check** | PASSED | `npm run build` completed successfully in 17.89s. |
| **Start & Dev Server** | PASSED | Vite dev server running on port 8080. |
| **UI Load** | PASSED | React SPA UI loads correctly with all routes intact. |
| **Webcam Access** | PASSED | `getUserMedia` integration functional in `Detect.tsx`. |
| **Face Detection** | PASSED | MediaPipe FaceLandmarker tracks 478 3D landmarks. |
| **Visual Inference** | PARTIAL | Runs MobileNet v2, but relies on heuristic formula (`1.2 - prob_sum`), not a deepfake model. |
| **rPPG Execution** | PASSED | POS/CHROM skin ROI extraction, HPF, and Goertzel FFT work. |
| **Trust Score Update** | PASSED | 8-Layer weighted fusion and veto engine updates frame-by-frame. |
| **Trust Meter UI** | PASSED | Dynamic progress bar & trust card render live score changes. |
| **Pulse Graph SVG** | PASSED | Live rPPG waveform renders properly. |
| **PWA Readiness** | FAILED | Service worker and web manifest missing. |
| **WebGPU Execution** | FAILED | TensorFlow WebGPU backend package not installed. |
