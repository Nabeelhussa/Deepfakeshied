import { describe, it, expect } from "vitest";
import { generateLocalForensicReport, TelemetryData } from "../lib/forensic-analyst";

describe("Digital Forensics Analyst Engine", () => {
  it("should generate a strictly formatted report with all 4 required sections for authentic telemetry", () => {
    const authenticTelemetry: TelemetryData = {
      bpm: 72,
      rppgConfidence: 0.85,
      blinkRate: 16,
      ocularScore: 0.92,
      spatialScore: 0.88,
      temporalScore: 0.90,
      biologicalScore: 0.85,
      frequencyScore: 0.82,
      poseScore: 0.94,
      anatomyScore: 0.91,
      spectralScore: 0.89,
      overallTrustScore: 88,
      sessionDuration: 15.2,
    };

    const report = generateLocalForensicReport(authenticTelemetry);

    expect(report).toBeDefined();
    expect(typeof report.markdown_report).toBe("string");

    const content = report.markdown_report;

    // Must contain all 4 standard required sections
    expect(content).toContain("Executive Summary");
    expect(content).toContain("Subject Telemetry Analysis");
    expect(content).toContain("Biological Anomalies Detected");
    expect(content).toContain("Final Forensic Conclusion");

    // Verdict must state REAL
    expect(content).toContain("VERDICT: REAL");
    expect(content).toContain("72 BPM");
    expect(content).toContain("All evaluated biological telemetry signals");
  });

  it("should detect red flags and generate anomalies for deepfake synthetic telemetry", () => {
    const deepfakeTelemetry: TelemetryData = {
      bpm: null,
      rppgConfidence: 0.12,
      blinkRate: 4,
      ocularScore: 0.25,
      spatialScore: 0.35,
      temporalScore: 0.40,
      biologicalScore: 0.15,
      frequencyScore: 0.20,
      poseScore: 0.30,
      anatomyScore: 0.28,
      spectralScore: 0.22,
      overallTrustScore: 24,
      sessionDuration: 12.0,
    };

    const report = generateLocalForensicReport(deepfakeTelemetry);

    expect(report).toBeDefined();
    const content = report.markdown_report;

    // Must state FAKE
    expect(content).toContain("VERDICT: FAKE");

    // Must list detected biological anomalies
    expect(content).toContain("Absence of Hemodynamic Pulse Signal");
    expect(content).toContain("Ocular Motion Aberration");
    expect(content).toContain("Spectral Diffusion Artifacts");
    expect(content).toContain("Anatomical Structural Violation");
  });
});
