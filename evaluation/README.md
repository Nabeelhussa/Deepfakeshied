# Deepfake Shield — Evaluation & Telemetry Instrumentation Infrastructure

This directory contains the testing, benchmarking, and telemetry measurement infrastructure for **Deepfake Shield**.

## Directory Structure

```
evaluation/
├── raw-results/        # Raw exported CSV measurement files from live telemetry sessions
├── processed-results/  # Aggregated statistical summaries and Markdown metrics tables
├── figures/            # Performance & accuracy plots (FPS vs. Latency, ROC curves)
├── tables/             # Markdown and CSV evaluation summary tables
├── scripts/            # Telemetry processing and aggregation scripts
└── reports/            # Evaluation benchmark reports and analysis logs
```

---

## Instrumentation & Measurement System

Deepfake Shield includes an on-device empirical telemetry recorder ([telemetry-instrumentation.ts](file:///d:/human-or-bot-shield-main/Deepfakeshield/src/lib/telemetry-instrumentation.ts)) that samples real-time execution performance frame-by-frame.

### 1. Recorded Metrics (Per Frame)

Every video frame records:
- **`frame_number`**: Incremental integer frame count.
- **`timestamp_ms`**: Milliseconds elapsed since detection session start.
- **`iso_timestamp`**: Precise ISO 8601 UTC timestamp.
- **`fps`**: Real-time throughput (frames per second).
- **`cnn_inference_latency_ms`**: Spatial CNN MobileNet execution time (ms).
- **`rppg_latency_ms`**: Remote photoplethysmography skin ROI signal extraction & FFT timing (ms).
- **`total_processing_latency_ms`**: Landmark tracking + ROI processing execution time (ms).
- **`endToEnd_pipeline_latency_ms`**: Total time from frame capture to final score update (ms).
- **`face_detected`**: Boolean indicator (`1` or `0`).
- **`visual_spatial_score`**: Spatial CNN visual classification score (0.00 – 1.00).
- **`biological_confidence`**: rPPG pulse signal peak-to-average power ratio (0.00 – 1.00).
- **`estimated_bpm`**: Peak cardiac frequency estimate (45–180 BPM).
- **`trust_score`**: Fused 8-layer adaptive trust score (0 – 100).
- **`deepfake_score`**: Inverse trust score (`100 - trustScore`).
- **`final_decision`**: Categorical system verdict (`REAL`, `UNCERTAIN`, `DEEPFAKE`, or `NO_FACE`).

### 2. Session Environment Metadata

Every recorded CSV session header automatically captures client system information:
- **Operating System** (Windows, macOS, Linux, Android, iOS)
- **Browser & Version** (Chrome, Edge, Firefox, Safari)
- **CPU Cores** (`navigator.hardwareConcurrency`)
- **GPU Renderer** (WebGL unmasked renderer string)
- **RAM Memory** (`navigator.deviceMemory`)
- **Camera / Video Resolution** (e.g., `1280x720`)
- **WebGPU Availability** (`true` / `false`)
- **WebAssembly Availability** (`true` / `false`)

---

## How to Run & Export Measurements

### Step 1: Start the Detector
1. Open Deepfake Shield (`npm run dev` or navigate to `/detect`).
2. Click **Start camera**, **Share screen**, or **Upload video**.

### Step 2: View Live Diagnostics (HUD)
- While detection runs, an interactive **Telemetry & Performance HUD** appears at the top of the screen displaying real-time Visual Score, Heart Rate, Biological Confidence, Trust Score, FPS, and detailed Latency breakdowns (ms).

### Step 3: Export CSV Telemetry
- Click **Export CSV** on the Diagnostic HUD header or click **Export CSV Telemetry** on the final detection summary report screen.
- Save the resulting CSV file into the `evaluation/raw-results/` folder (e.g., `evaluation/raw-results/session_01.csv`).

### Step 4: Process Raw CSV Data
Run the automated aggregation utility to calculate sample mean, standard deviation, min, and max latencies:

```bash
npx tsx evaluation/scripts/process-telemetry-csv.ts evaluation/raw-results/<your-session-file>.csv
```

This script generates a processed Markdown statistical report in `evaluation/processed-results/`.
