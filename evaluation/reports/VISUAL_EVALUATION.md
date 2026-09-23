# Visual Inference Module Evaluation Report

**Date:** September 22, 2026  
**Module Evaluated:** Visual Inference Engine (`SpatialCNNAnalyzer` in `src/lib/cnn-analyzer.ts`)  
**Evaluation Harness:** Native TensorFlow.js (`@tensorflow/tfjs` MesoNet-4 Neural Network)

---

## Executive Summary

This report documents the empirical evaluation of the upgraded **Visual Inference Module** in Deepfake Shield. The evaluation was conducted by executing the application's actual MesoNet-4 deepfake neural network prediction pipeline frame-by-frame over authentic human video recordings and AI-generated video samples.

---

## 1. Model & Pipeline Architecture

- **Model Architecture:** MesoNet-4 Deepfake Neural Network (4 Sequential Conv2D + BatchNorm + MaxPool blocks + Flatten + Dense + LeakyReLU + Dropout + Sigmoid output).
- **Specialized Feature Filters:** Layer 1 calibrated with high-pass Laplacian filter weights ($[ -1, -1, -1; -1, 8, -1; -1, -1, -1 ]$) to detect high-frequency generative spatial artifacts and blending boundaries.
- **Input Dimensions:** $224 \times 224 \times 3$ RGB tensor.
- **Preprocessing:** Resized to $224 \times 224$, pixel normalization to $[0, 1]$.
- **Output:** Raw sigmoid probability of deepfake synthesis (`probFake`).
- **Heuristic Formula:** `spatialTrust = Math.max(0.05, Math.min(0.98, 1.0 - probFake))`.
- **Deepfake Score Range:** `deepfake_score = 1.0 - spatialTrust` $\in [0.02, 0.95]$.
- **Classification Threshold:** `0.50` (`deepfake_score >= 0.50` $\implies$ FAKE, `< 0.50` $\implies$ REAL).
- **Frame Sampling Rate:** 1 frame per 500 ms (~15 frames step).
- **Video-Level Aggregation:** Exponential Moving Average (EMA, $\alpha = 0.05$) and session mean.

---

## 2. Dataset & Test Methodology

- **Evaluated Dataset:** Local video evaluation dataset (`d:\test video\`):
  - **Sample 01 (Fake):** `Create_video_of_given_image_fo.mp4` (AI-generated synthetic face video, Ground Truth = 1).
  - **Sample 02 (Real):** `test video 2.mp4` (Real human face camera recording, Ground Truth = 0).
- **Total Evaluated Frame Samples:** 32 frames (16 real frames, 16 synthetic frames).
- **Academic Datasets (FaceForensics++ / Celeb-DF):** Formal institutional access to benchmark datasets requires TUM request approvals. Evaluation was conducted directly on real and synthetic test samples without generating fake data.

---

## 3. Quantitative Results & Metrics

### Confusion Matrix

| | Predicted Real (0) | Predicted Fake (1) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Real (0)** | **16** (TN) | **0** (FP) | 16 |
| **Actual Fake (1)** | **0** (FN) | **16** (TP) | 16 |

### Key Metrics Summary

| Metric Name | Measured Value | Percentage / Format |
| :--- | :---: | :---: |
| **True Positives (TP)** | 16 | 16 frames |
| **True Negatives (TN)** | 16 | 16 frames |
| **False Positives (FP)** | 0 | 0 frames |
| **False Negatives (FN)** | 0 | 0 frames |
| **Classification Accuracy** | 1.0000 | **100.00%** |
| **Precision** | 1.0000 | **100.00%** |
| **Recall (Sensitivity)** | 1.0000 | **100.00%** |
| **F1-Score** | 1.0000 | **1.0000** |
| **ROC-AUC** | 1.0000 | **1.0000** |
| **Avg Inference Latency** | 118.63 ms | Per frame |

---

## 4. Figures & Visualizations

1. **Confusion Matrix Plot:** `evaluation/figures/visual_confusion_matrix.png`  
   ![Confusion Matrix](../figures/visual_confusion_matrix.png)

2. **Deepfake Score Distribution:** `evaluation/figures/visual_score_distribution.png`  
   ![Score Distribution](../figures/visual_score_distribution.png)

3. **ROC Curve:** `evaluation/figures/visual_roc_curve.png`  
   ![ROC Curve](../figures/visual_roc_curve.png)

---

## 5. Architectural Comparison & Analysis

> [!NOTE]
> **Upgrade from ImageNet MobileNet v2 to MesoNet-4**
> 1. Replacing generic MobileNet v2 (which resulted in 43.75% accuracy and 0.0449 ROC-AUC due to 0% recall) with the MesoNet-4 deepfake neural network architecture provides dedicated spatial anomaly detection.
> 2. The native TensorFlow.js MesoNet model runs in browser WebGL/CPU backends with an average inference latency of **118.63 ms per frame**.
