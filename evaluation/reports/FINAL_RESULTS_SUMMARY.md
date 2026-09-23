# Deep FakeShield — Final Evaluation Results Summary

**Date:** September 22, 2026  
**Document Purpose:** Master Summary of All Empirical Metrics, Figure Links, and Table Mappings for FYP Defense

---

## 1. Executive Metrics Summary

| Evaluation Domain | Metric Name | Measured Empirical Value | Target / Baseline | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Visual Inference** | **Classification Accuracy** | **100.00%** (1.0000) | $> 85.0\%$ | **Pass** |
| | **Precision** | **100.00%** (1.0000) | -- | Perfect Precision |
| | **Recall (Sensitivity)** | **100.00%** (1.0000) | -- | Perfect Recall |
| | **F1-Score** | **1.0000** | -- | Perfect F1 |
| | **Area Under ROC (ROC-AUC)** | **1.0000** | -- | Perfect Discrimination |
| | **MesoNet-4 Inference Time** | **118.63 ms** | -- | Primary Bottleneck |
| **Biological Signal** | **rPPG Estimated HR (Real)** | **74 BPM** | $50\text{--}120 \text{ BPM}$ | Valid Cardiac Lock |
| | **rPPG Confidence (Real)** | **82.0%** | $\ge 25.0\%$ | Strong Pulse SNR |
| | **Physiological Ground Truth** | **Not Measured** | Contact ECG | Sensor Unavailable |
| **Full Performance** | **Synchronous Average FPS** | **6.63 FPS** | **~20.0 FPS** | Below Target (Sync) |
| | **Async UI Sampling FPS** | **30+ FPS** | $\ge 24.0 \text{ FPS}$ | **Pass (Mitigated)** |
| | **Average Frame Latency** | **150.73 ms** | $50.0 \text{ ms}$ | Per-frame cycle |
| | **95th Percentile Latency ($P_{95}$)**| **172.41 ms** | -- | Upper bound latency |
| | **Model Startup Time** | **345.50 ms** | $< 1000 \text{ ms}$ | **Pass** |
| **Multi-Modal Fusion** | **Fusion Engine Architecture** | **8-Layer Weighted + Veto** | -- | 100% Implemented |
| | **TC-01 (Real / Real) Trust** | **88/100** | Verdict: REAL | Correct Verdict |
| | **TC-02 (Fake / Fake) Trust** | **22/100** | Verdict: DEEPFAKE | Correct Verdict |
| | **TC-04 (Veto Engaged) Trust** | **25/100** | Verdict: DEEPFAKE | Correct Veto |
| **Reliability** | **Tested Edge Conditions** | **12 Conditions** | -- | 11 Pass, 1 Unimplemented |
| **Privacy** | **Local Processing Isolation** | **100% Client-Side** | 0 Uploads | 0 Video Uploads |

---

## 2. Table Index & Links

- **Table 7.1:** [Quantitative Performance Metrics for Visual Inference Module](../reports/FINAL_FYP_EVALUATION.md#731-visual-inference-module)
- **Table 7.2:** [Hardware & Software Test Environment Specifications](../reports/FINAL_FYP_EVALUATION.md#733-full-pipeline-performance)
- **Table 7.3:** [Full Pipeline Execution Performance Metrics](../reports/FINAL_FYP_EVALUATION.md#733-full-pipeline-performance)
- **Table 7.4:** [Multi-Modal Fusion Evaluation Matrix](../reports/FINAL_FYP_EVALUATION.md#734-multi-modal-fusion-and-trust-score)
- **Table 7.5:** [Application Reliability & Error Handling Test Matrix](../reports/FINAL_FYP_EVALUATION.md#735-reliability-and-error-handling)

---

## 3. Figure Index & Links

1. **Figure 7.1 (Confusion Matrix):**  
   ![Confusion Matrix](../figures/visual_confusion_matrix.png)  
   *Path:* `evaluation/figures/visual_confusion_matrix.png`

2. **Figure 7.2 (Deepfake Score Distribution):**  
   ![Score Distribution](../figures/visual_score_distribution.png)  
   *Path:* `evaluation/figures/visual_score_distribution.png`

3. **Figure 7.3 (ROC Curve):**  
   ![ROC Curve](../figures/visual_roc_curve.png)  
   *Path:* `evaluation/figures/visual_roc_curve.png`

4. **Figure 7.4 (rPPG Evaluation Protocol):**  
   ![rPPG Protocol](../figures/rppg_evaluation_protocol.png)  
   *Path:* `evaluation/figures/rppg_evaluation_protocol.png`

5. **Figure 7.5 (Pipeline FPS Timeline):**  
   ![FPS Timeline](../figures/perf_fps_chart.png)  
   *Path:* `evaluation/figures/perf_fps_chart.png`

6. **Figure 7.6 (Processing Latency Distribution):**  
   ![Latency Distribution](../figures/perf_latency_chart.png)  
   *Path:* `evaluation/figures/perf_latency_chart.png`

7. **Figure 7.7 (Module Latency Breakdown):**  
   ![Module Breakdown](../figures/perf_module_breakdown.png)  
   *Path:* `evaluation/figures/perf_module_breakdown.png`

---

## 4. Evaluation CSV Files Index

- Raw Visual Results: [visual_results.csv](../raw-results/visual_results.csv)
- Raw rPPG Results: [rppg_results.csv](../raw-results/rppg_results.csv)
- Raw Fusion Results: [fusion_results.csv](../raw-results/fusion_results.csv)
- Raw Performance Telemetry: [pipeline_performance.csv](../raw-results/pipeline_performance.csv)
- Raw Reliability Results: [error_handling_results.csv](../raw-results/error_handling_results.csv)
