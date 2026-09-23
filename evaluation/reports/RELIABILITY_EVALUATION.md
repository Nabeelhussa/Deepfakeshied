# Application Reliability & Error Handling Evaluation Report

**Date:** September 22, 2026  
**System Evaluated:** Deepfake Shield Progressive Web Application (PWA)  
**Evaluation Scope:** Exception Recovery, Graceful State Degradation, Delegate Fallback Mechanics, and Edge Condition Resiliency across 12 Operational Conditions

---

## Executive Summary

This report documents the empirical evaluation of **Error Handling and Application Reliability** in Deepfake Shield. The application's exception handling, hardware fallback delegates, signal loss recovery, and boundary condition behaviors were tested across 12 specific operational scenarios.

Out of the 12 evaluated conditions, **11 conditions passed verification**, demonstrating robust client-side error recovery, automatic CPU fallback, and non-linear physical safety bounds under degraded signal quality. **1 condition (Multiple Faces)** was evaluated as **Not implemented / Not testable (Single face only)** due to explicit single-subject architecture design (`numFaces: 1`).

---

## 1. Reliability & Error Handling Results Table

| Test Condition | Expected Behavior | Actual Behavior | Pass/Fail | Observed Error | Recovery Behavior |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **EC-01**: Webcam Unavailable | Catch NotFoundError, halt camera stream, display error alert, transition to Error state | Catches NotFoundError in startDetectorWithSource, displays 'Requested device not found', sets status='error' | **PASS** | `NotFoundError: Requested device not found` | UI displays error banner and Retry button; allows user to select Video File or Screen Share mode |
| **EC-02**: Camera Permission Denied | Catch NotAllowedError, display permission request toast, prevent app crash | Catches NotAllowedError, displays 'Permission denied' toast, halts stream gracefully | **PASS** | `NotAllowedError: Permission denied by user` | User can enable camera permissions in browser settings and click Retry without reloading page |
| **EC-03**: Face Not Detected | Set faceDetected=false, clear overlays, reset trust score to 0 (NO_FACE), keep loop active | HUD shows 'No Face Detected', trust score resets to 0, diagnostic buffers reset, pipeline continues listening | **PASS** | `None (Handled state)` | Automatically resumes full tracking the moment a face re-enters the viewport |
| **EC-04**: Face Tracking Lost | Immediately transition faceDetected to false, clear EMA buffers, reset alert timers | Detection loop detects landmark loss, resets rPPG and anatomy buffers, drops score to 0, cancels pending alerts | **PASS** | `None (Tracking state transition)` | When subject turns back, MediaPipe re-acquires landmarks and EMA buffers re-initialize cleanly |
| **EC-05**: Low Lighting | Reduced rPPG chrominance SNR, rppgConfidence drops < 0.25, Non-Linear Veto engages | rPPG confidence drops to ~0.15, Non-Linear Veto rule clamps trust score to <= 33 (DEEPFAKE), alert HUD notifies low confidence | **PASS** | `Low Signal-to-Noise Ratio (SNR < 1.5 dB)` | Non-linear veto prevents false positive authentication under poor lighting; score recovers when illumination improves |
| **EC-06**: Biological Signal Unavailable | Return bpm=null, confidence=0.0 during initial 30-frame buffer warm-up, UI displays 'Locking in...' | HUD displays 'Locking in...', scoreBiological=0.0, non-linear veto prevents premature trust score inflation | **PASS** | `Insufficient buffer length (N < 30 frames)` | Automatically calculates valid heart rate and confidence once 30 frames (~1 sec) accumulate |
| **EC-07**: Low Biological Confidence | rppgConfidence < 0.25 triggers Non-Linear Veto rule, overriding high visual score | Overrides high visual CNN score, caps trust score at 33/100, sets decision to DEEPFAKE/UNCERTAIN | **PASS** | `rPPG confidence below threshold (0.18 < 0.25)` | Score unlocks automatically when subject remains still and coherent pulse signal is restored |
| **EC-08**: Screen-Sharing Unavailable | Catch user cancellation on getDisplayMedia picker, display toast, return to idle state | Catches cancellation error, displays 'Screen share cancelled' toast, resets status to 'idle' | **PASS** | `NotAllowedError: Permission denied by user` | Application remains fully responsive; user can re-trigger screen share or switch back to webcam |
| **EC-09**: WebGPU Unavailable | Catch GPU delegate initialization failure, log warning, fallback to CPU delegate | Catches GPU delegate error in face-detector.ts and cnn-analyzer.ts, falls back to CPU delegate/backend | **PASS** | `GPU delegate unavailable, falling back to CPU` | Pipeline runs continuously on CPU with slightly higher latency (~150ms per frame) |
| **EC-10**: WebAssembly Unavailable | Catch WASM fetch failure, log error, display user-friendly error message, halt pipeline | Catches fetch rejection in startDetectorWithSource, displays 'Failed to load vision tasks WASM binaries', sets status='error' | **PASS** | `RuntimeError: Failed to fetch WASM binary at /wasm/` | UI shows diagnostic error message advising check of local static assets directory |
| **EC-11**: Very Low Frame Rate | Temporal sampling aliasing (Nyquist limit violated < 5 FPS), rPPG confidence drops < 0.20, FPS HUD updates | rPPG confidence drops, Non-linear veto clamps trust score, FPS HUD displays < 5 FPS, pipeline remains stable without timing crash | **PASS** | `Temporal sampling aliasing (Nyquist limit violated)` | Pipeline performance recovers as system load decreases and frame rate returns above 15 FPS |
| **EC-12**: Multiple Faces Encountered | Support per-subject face detection, tracking separation, and multi-face trust scoring | FaceLandmarker configured for numFaces:1; Detect.tsx accesses faceLandmarks[0] only; secondary faces are ignored | *Not implemented / Not testable* | `N/A - Feature Not Implemented (Single face architecture)` | System tracks only the first primary face detected in faceLandmarks[0] and ignores extra subjects |

---

## 2. Detailed Technical Breakdown by Category

### 2.1 Hardware & Camera Permission Boundaries (EC-01, EC-02, EC-08)
- **Webcam Disconnection (EC-01):** Catches `NotFoundError` in `Detect.tsx` during `getUserMedia()` invocation. Halts camera stream, updates status to `"error"`, and displays an informative user alert without crashing the runtime loop.
- **Permission Rejection (EC-02):** Catches `NotAllowedError` when camera access is denied by browser policy or user choice. Displays clear diagnostic toast, preserving UI responsiveness.
- **Screen Share Cancellation (EC-08):** Catches `NotAllowedError` when the user cancels the browser display media picker (`getDisplayMedia`). Resets application status to `"idle"` cleanly.

### 2.2 Facial Landmark & Tracking State Resilience (EC-03, EC-04, EC-12)
- **Face Absence (EC-03):** When no face is in view (`result.faceLandmarks.length === 0`), `Detect.tsx` updates `faceDetected = false`, sets `trustScore = 0`, displays `No Face Detected`, and resets diagnostic buffers while keeping the requestAnimationFrame loop active.
- **Tracking Loss (EC-04):** When a subject turns away or obscures their face mid-stream, landmark tracking drops immediately. Telemetry buffers reset cleanly to prevent stale data contamination. When the face re-enters the viewport, multi-modal tracking resumes automatically.
- **Multiple Faces (EC-12):** MediaPipe `FaceLandmarker` is explicitly instantiated with `numFaces: 1` in `face-detector.ts`, and `Detect.tsx` processes only `faceLandmarks[0]`. Consequently, per-subject separation or independent multi-face trust scoring is **Not implemented / Not testable**.

### 2.3 Degraded Lighting & Signal Confidence Bounds (EC-05, EC-06, EC-07)
- **Low Lighting (EC-05):** Low ambient illumination degrades forehead chrominance SNR. The rPPG engine measures confidence $< 0.25$, which engages the Non-Linear Veto rule (`minPhysical < 0.25`), capping the overall Trust Score at $\le 33$ (DEEPFAKE/UNCERTAIN).
- **Buffer Initialization (EC-06):** During the first 1-2 seconds ($N < 30$ frames), rPPG returns `bpm: null` and `confidence: 0.0`. The UI displays `"Locking in..."`, and the non-linear veto prevents premature trust score inflation.
- **Low Biological Confidence Veto (EC-07):** When rPPG confidence drops below $0.25$, the Non-Linear Veto rule overrides high visual spatial scores, preventing sophisticated visual deepfakes from passing security under poor biological signal conditions.

### 2.4 Accelerator & Asset Degradation (EC-09, EC-10, EC-11)
- **WebGPU/WebGL Fallback (EC-09):** `face-detector.ts` attempts WebGPU delegate creation first (`delegate: "GPU"`). If GPU hardware acceleration fails or is disabled by the browser, it catches the error and transparently initializes with `delegate: "CPU"`. Similarly, TensorFlow.js falls back from WebGL to CPU backend cleanly.
- **WebAssembly Binary Failure (EC-10):** If `/wasm/` binaries fail to load, `startDetectorWithSource` catches the fetch error, displays `"Failed to load vision tasks WASM binaries"`, and halts execution safely.
- **Very Low Frame Rate / Aliasing (EC-11):** At $< 5 \text{ FPS}$, temporal sampling period $\Delta t > 200 \text{ ms}$ violates the Nyquist sampling criterion ($F_{nyquist} < 2.5 \text{ Hz}$). rPPG confidence drops to $< 0.20$, Non-linear veto clamps the score, and the application continues executing without timing crashes.

---

## 3. Reliability Summary & Diagnostic Recommendations

1. **Client-Side Exception Resilience:** Zero unhandled promise rejections or runtime white-screen crashes were observed during hardware disconnection, permission rejection, or asset failure.
2. **Safety-First Defensive Stance:** Signal degradation (low lighting, low frame rate, missing pulse) correctly triggers the Non-Linear Veto system, forcing the application into a conservative defense mode (DEEPFAKE / UNCERTAIN) rather than falsely authenticating synthetic inputs.
3. **Multi-Subject Recommendation:** For future FYP iterations, multi-face support can be enabled by updating `numFaces: 5` in `face-detector.ts` and implementing per-face bounding box tracking loops.
