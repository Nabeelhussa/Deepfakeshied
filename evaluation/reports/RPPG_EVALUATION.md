# Biological Signal / rPPG Module Evaluation Report

**Date:** September 22, 2026  
**Module Evaluated:** Remote Photoplethysmography Engine (`RPPGEstimator` in `src/lib/rppg.ts`)  
**Status:** Implementation Inspected — Evaluation Protocol Defined

---

## Executive Summary

This report documents the architectural inspection and evaluation status of the **Biological Signal / rPPG (Remote Photoplethysmography) Module** in Deepfake Shield. 

> [!IMPORTANT]
> **Primary Evaluation Finding:**  
> **"Not measured — reference physiological ground truth is unavailable."**
> 
> Neither the project repository nor the local environment contains synchronized contact physiological reference heart-rate measurements (e.g., ECG chest strap or contact pulse oximeter logs). In strict adherence to academic evaluation rules, no fake or fabricated reference BPM values were generated.

---

## 1. Technical Implementation Specifications

Inspection of `src/lib/rppg.ts` and `src/pages/Detect.tsx` reveals the following technical specifications:

### 1.1 Face & Skin Region of Interest (ROI)
- **Landmark Extraction:** Computed dynamically per frame using MediaPipe 3D FaceLandmarker landmarks.
- **Forehead ROI Coordinates:**
  - Center X: $cx = \frac{\text{minX} + \text{maxX}}{2}$
  - Forehead Center Y: $\text{foreheadY} = \text{minY} + 0.18 \times (\text{maxY} - \text{minY})$
  - ROI Width: $35\%$ of facial bounding box width ($0.35 \times \text{faceWidth}$)
  - ROI Height: $10\%$ of facial bounding box height ($0.10 \times \text{faceHeight}$)
- **Pixel Sampling:** HTML5 Canvas `getImageData(rx, ry, rw, rh)` extracts raw RGBA pixels within the forehead patch.

### 1.2 Color Channel Processing & Artifact Reduction
- **Spatial Mean Extraction:** Computes spatial average Red ($\bar{R}$), Green ($\bar{G}$), and Blue ($\bar{B}$) pixel intensities across the ROI.
- **POS / CHROM Noise Subtraction Derivative:**
  Normalized Green $\bar{G}_{\text{norm}} = \bar{G} / \text{mean}(\bar{G})$ and normalized Red $\bar{R}_{\text{norm}} = \bar{R} / \text{mean}(\bar{R})$ are combined:
  $$S(t) = \bar{G}_{\text{norm}} - \bar{R}_{\text{norm}}$$
  Because sub-dermal capillary blood perfusion selectively absorbs green spectrum light while red light primarily reflects surface skin illumination, subtracting normalized Red cancels ambient lighting fluctuations, motion jitter, and camera auto-white-balance noise.

### 1.3 Signal Filtering & Preprocessing
- **Linear Resampling:** Resamples time-series data to an even target sample rate $f_s = 30\text{ Hz}$.
- **High-Pass Filter (HPF):** Subtracts a 1.5-second moving average ($\pm 0.75\text{s}$ half-window or $\approx 22$ samples) to remove low-frequency baseline drift and illumination shifts:
  $$x_{\text{filtered}}[i] = x[i] - \frac{1}{2K+1} \sum_{j=i-K}^{i+K} x[j]$$
- **Windowing:** Applies a Hann (Hanning) window to minimize spectral leakage:
  $$w[i] = 0.5 - 0.5 \cos\left(\frac{2\pi i}{N-1}\right)$$

### 1.4 Sampling Frequency & Window Parameters
- **Target Sampling Frequency ($f_s$):** $30\text{ Hz}$.
- **Buffer Window Size:** $8\text{ seconds}$ ($BUFFER\_SIZE = 240\text{ samples}$).
- **Minimum Processing Duration:** $3\text{ seconds}$ ($90\text{ samples}$) required before producing an initial BPM estimate.

### 1.5 Fourier Transform & Peak Detection
- **Goertzel Discrete Fourier Transform Scan:** Evaluates DFT spectral power across physiological human cardiac frequencies from **45 to 180 BPM** ($0.75\text{ to }3.0\text{ Hz}$) at $1\text{ BPM}$ step resolution.
- For each BPM candidate $b \in [45, 180]$ ($f = b / 60$, $\omega = 2\pi f / f_s$):
  $$\text{Re}(b) = \sum_{i=0}^{N-1} x_{\text{filtered}}[i] \cos(\omega i), \quad \text{Im}(b) = \sum_{i=0}^{N-1} x_{\text{filtered}}[i] \sin(\omega i)$$
  $$\text{Power}(b) = \text{Re}(b)^2 + \text{Im}(b)^2$$
- **Dominant Peak Selection:** Identifies the frequency bin containing maximum spectral energy:
  $$b^* = \arg\max_{b \in [45, 180]} \text{Power}(b)$$

### 1.6 Heart Rate Calculation
- **Estimated Heart Rate:** $\text{Estimated BPM} = b^*$.

### 1.7 Biological Signal Confidence Calculation
- **Peak-to-Average Power Ratio (PAPR):**
  $$\text{Ratio} = \frac{\text{Power}(b^*)}{\frac{1}{136} \sum_{b=45}^{180} \text{Power}(b)}$$
- **Normalized Confidence Score:** Clamped to $[0.0, 1.0]$:
  $$\text{Confidence} = \max\left(0, \min\left(1, \frac{\text{Ratio} - 1}{8}\right)\right)$$

---

## 2. Physiological Evaluation Protocol

To perform a rigorous physiological evaluation of the rPPG module with true ground-truth measurements, the following experimental protocol must be executed:

![rPPG Validation Protocol](../figures/rppg_evaluation_protocol.png)

### 2.1 Required Equipment & Setup
1. **Reference Physiological Sensor (Ground Truth):**
   - Medical-grade Polar H10 ECG Chest Strap (Bluetooth/ANT+, 1000 Hz sampling rate, R-R interval accuracy $\pm 1\text{ ms}$) OR Nonin 9590 Medical Pulse Oximeter.
2. **Video Capture Setup:**
   - 1080p Web Camera capturing at constant 30 FPS / 60 FPS.
   - Stable LED lighting (ambient illuminance 300–500 Lux, 5000K color temperature, non-flickering DC power).
3. **Participants:**
   - Minimum 10 human participants across diverse skin phototypes (Fitzpatrick scale I–VI) under rest and mild physical post-exercise conditions.

### 2.2 Execution Procedure
1. Attach Polar H10 chest strap to the subject and initiate ECG R-R recording.
2. Position subject 0.75m in front of webcam in a seated posture.
3. Launch Deepfake Shield (`/detect`) and start video acquisition.
4. Record simultaneous 60-second telemetry sessions.
5. Export CSV telemetry session via the Diagnostic HUD (**Export Telemetry CSV**).

### 2.3 Required Evaluation Metrics
For each paired measurement $(BPM_{\text{ref}}, BPM_{\text{est}})$ recorded across valid window epochs:
- **Absolute Error (AE):** $|BPM_{\text{est}} - BPM_{\text{ref}}|$
- **Signed Error:** $BPM_{\text{est}} - BPM_{\text{ref}}$
- **Mean Absolute Error (MAE):** $\frac{1}{K} \sum_{k=1}^K |BPM_{\text{est}, k} - BPM_{\text{ref}, k}|$
- **Root Mean Square Error (RMSE):** $\sqrt{\frac{1}{K} \sum_{k=1}^K (BPM_{\text{est}, k} - BPM_{\text{ref}, k})^2}$
- **Mean Error (Bias):** $\frac{1}{K} \sum_{k=1}^K (BPM_{\text{est}, k} - BPM_{\text{ref}, k})$
- **Pearson Correlation ($r$):** Standard linear correlation between reference and estimated BPM.
- **Bland-Altman Agreement Limits:** Mean Bias $\pm 1.96 \cdot \text{SD}_{\text{error}}$.
