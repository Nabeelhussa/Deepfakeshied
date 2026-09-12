/**
 * Spectral Diffusion Artifact Analyzer
 * Generative AI models (especially those using VAE decoders like Sora/Veo)
 * leave invisible high-frequency "checkerboard" artifacts.
 * Real webcams produce random Gaussian sensor noise.
 */

export class SpectralAnalyzer {
  private spectralScoreEMA = 0.5;

  /**
   * Evaluates a small patch of skin (e.g., forehead) for spectral artifacts.
   * We calculate the spatial gradients to find unnatural high-frequency patterns.
   */
  public analyzePatch(imageData: Uint8ClampedArray, width: number, height: number): number {
    if (width < 8 || height < 8) return this.spectralScoreEMA;

    let hFreqEnergy = 0;
    let vFreqEnergy = 0;
    let totalEnergy = 0;
    let count = 0;

    // Convert to grayscale and compute gradients
    const luma = new Float32Array(width * height);
    for (let i = 0; i < imageData.length; i += 4) {
      // Fast luma
      luma[i / 4] = imageData[i] * 0.299 + imageData[i + 1] * 0.587 + imageData[i + 2] * 0.114;
    }

    // Measure periodic high-frequency noise (checkerboard)
    // We look at the difference between adjacent pixels (gradient)
    // and the difference of differences (second derivative)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const center = luma[idx];
        
        // Horizontal and Vertical 1st derivatives
        const dx = luma[idx + 1] - center;
        const dy = luma[idx + width] - center;
        
        // 2nd derivatives (Laplacian approximation for high freq peaks)
        const ddx = luma[idx + 1] + luma[idx - 1] - 2 * center;
        const ddy = luma[idx + width] + luma[idx - width] - 2 * center;

        hFreqEnergy += Math.abs(ddx);
        vFreqEnergy += Math.abs(ddy);
        totalEnergy += Math.abs(dx) + Math.abs(dy);
        count++;
      }
    }

    if (count === 0 || totalEnergy === 0) return this.spectralScoreEMA;

    hFreqEnergy /= count;
    vFreqEnergy /= count;
    const avgEnergy = totalEnergy / count;

    // Deepfake VAEs often have unusually high 2nd derivative energy
    // compared to natural 1st derivative gradient (checkerboard effect).
    // Real noise is more balanced.
    const hRatio = hFreqEnergy / (avgEnergy + 1e-5);
    const vRatio = vFreqEnergy / (avgEnergy + 1e-5);

    // If the ratio of high-frequency periodic energy is unnaturally high or low,
    // it's a strong indicator of synthetic generation.
    const maxRatio = Math.max(hRatio, vRatio);

    // Heuristic bounds for natural skin sensor noise
    // VAE checkerboards spike maxRatio.
    // Modern AI models like Veo/Sora often produce overly smooth "plastic" skin, 
    // resulting in unnaturally low total gradient energy compared to real webcam noise.
    let instSpectralScore = 0.5;
    if (maxRatio > 1.6 || maxRatio < 0.4 || avgEnergy < 0.5) {
      instSpectralScore = 0.1; // Synthetic
    } else {
      instSpectralScore = 0.95; // Natural
    }

    this.spectralScoreEMA = this.spectralScoreEMA * 0.9 + instSpectralScore * 0.1;
    return this.spectralScoreEMA;
  }

  public reset() {
    this.spectralScoreEMA = 0.5;
  }
}
