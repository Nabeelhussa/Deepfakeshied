import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

class SpatialCNNAnalyzer {
  private model: mobilenet.MobileNet | null = null;
  private isInitializing = false;

  async init() {
    if (this.model || this.isInitializing) return;
    this.isInitializing = true;
    try {
      // Ensure WebGL backend is ready
      await tf.setBackend("webgl");
      await tf.ready();
      // Load standard lightweight CNN (MobileNetV2)
      // For a real FYP deployment, this URL would point to a custom MesoNet model.json
      this.model = await mobilenet.load({ version: 2, alpha: 0.5 });
      console.log("Spatial CNN Model loaded successfully.");
    } catch (err) {
      console.error("Failed to load CNN model:", err);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Layer 1: Spatial Analysis (Visual Intelligence)
   * Analyzes the facial texture using a CNN. 
   * A real Deepfake model would return [real_prob, fake_prob].
   * Since we are using MobileNet as a placeholder for the architecture,
   * we simulate the anomaly score based on classification entropy.
   */
  async analyzeSpatial(canvas: HTMLCanvasElement): Promise<number> {
    if (!this.model) return 0.5; // Neutral confidence if not loaded
    
    try {
      // Real TensorFlow.js inference execution
      const predictions = await this.model.classify(canvas, 3);
      
      // Heuristic proxy for "AI Artifacts" using MobileNet:
      // If the CNN is highly confident in its top classes, the image has clear spatial features.
      // If entropy is high (low confidence across the board), it may indicate diffusion artifacts or blending issues.
      let confidenceSum = 0;
      for (const p of predictions) {
        confidenceSum += p.probability;
      }
      
      // Normalize to a 0.0 - 1.0 deepfake spatial trust score
      // A strong, crisp AI-generated face (like Veo/Sora) is often *too* perfect, yielding unnaturally high CNN confidence.
      // Real webcams have natural sensor noise and imperfections that lower standard CNN certainty.
      // Therefore, we invert the confidence proxy: overly perfect = potential AI, natural noise = human.
      const spatialTrust = Math.max(0.1, Math.min(0.98, 1.2 - confidenceSum));
      
      return spatialTrust;
    } catch (err) {
      console.warn("CNN prediction failed", err);
      return 0.5;
    }
  }
}

export const cnnAnalyzer = new SpatialCNNAnalyzer();
