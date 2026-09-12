/**
 * Generative Anatomy & Ocular Physics Engine
 * Evaluates MediaPipe blendshapes for physically impossible AI artifacts.
 */

export class AnatomyEngine {
  private lastBlinkLeft = 0;
  private lastBlinkRight = 0;
  private blinkAsymmetryPenalty = 0;

  // Smoothing for scores
  private ocularScoreEMA = 0.5;
  private anatomyScoreEMA = 0.5;

  public processBlendshapes(blendshapes: { categoryName: string; score: number }[]) {
    // Map blendshapes to a dictionary for fast lookup
    const bs: Record<string, number> = {};
    for (const b of blendshapes) {
      bs[b.categoryName] = b.score;
    }

    // --- Layer 6: Ocular Physics & Blink Dynamics ---
    const blinkLeft = bs["eyeBlinkLeft"] || 0;
    const blinkRight = bs["eyeBlinkRight"] || 0;

    // AI generators often fail to synchronize blinking perfectly,
    // or they create a "lazy eye" blink.
    const blinkDiff = Math.abs(blinkLeft - blinkRight);
    
    // Penalize if asymmetry is unnaturally high
    if (blinkDiff > 0.15) {
      this.blinkAsymmetryPenalty = Math.min(1.0, this.blinkAsymmetryPenalty + 0.1);
    } else {
      this.blinkAsymmetryPenalty = Math.max(0, this.blinkAsymmetryPenalty - 0.02);
    }

    // Base Ocular Score (starts high, drops if asymmetry detected)
    const instOcularScore = 1.0 - this.blinkAsymmetryPenalty;
    this.ocularScoreEMA = this.ocularScoreEMA * 0.9 + instOcularScore * 0.1;

    // --- Layer 7: Anatomical Muscle Constraints ---
    // Look for contradictory muscle movements that lack skeletal logic
    let anatomicalViolations = 0;

    // Rule 1: Duchenne Smile Consistency
    // Real smiles (mouthSmile) usually trigger cheek compression (cheekSquint)
    const smile = Math.max(bs["mouthSmileLeft"] || 0, bs["mouthSmileRight"] || 0);
    const cheekSquint = Math.max(bs["cheekSquintLeft"] || 0, bs["cheekSquintRight"] || 0);
    
    if (smile > 0.6 && cheekSquint < 0.1) {
      // "Botox/AI Smile" - strong smile but no cheek movement
      anatomicalViolations += 0.3;
    }

    // Rule 2: Jaw Open vs Lips Closed
    // If the jaw is fully open, the lips cannot be tightly closed
    const jawOpen = bs["jawOpen"] || 0;
    const mouthClose = bs["mouthClose"] || 0;
    
    if (jawOpen > 0.4 && mouthClose > 0.4) {
      // Physically impossible
      anatomicalViolations += 0.5;
    }

    // Rule 3: Eye gaze divergence (Strabismus hallucination)
    // AI often points pupils in slightly different directions
    const lookLeftL = bs["eyeLookInLeft"] || 0;
    const lookRightL = bs["eyeLookOutLeft"] || 0;
    const lookLeftR = bs["eyeLookOutRight"] || 0;
    const lookRightR = bs["eyeLookInRight"] || 0;

    const gazeL = lookLeftL - lookRightL;
    const gazeR = lookLeftR - lookRightR;
    const gazeDivergence = Math.abs(gazeL - gazeR);

    if (gazeDivergence > 0.3) {
      anatomicalViolations += 0.4;
    }

    const instAnatomyScore = Math.max(0.1, 1.0 - anatomicalViolations);
    this.anatomyScoreEMA = this.anatomyScoreEMA * 0.9 + instAnatomyScore * 0.1;

    this.lastBlinkLeft = blinkLeft;
    this.lastBlinkRight = blinkRight;

    return {
      scoreOcular: this.ocularScoreEMA,
      scoreAnatomy: this.anatomyScoreEMA,
    };
  }

  public reset() {
    this.lastBlinkLeft = 0;
    this.lastBlinkRight = 0;
    this.blinkAsymmetryPenalty = 0;
    this.ocularScoreEMA = 0.5;
    this.anatomyScoreEMA = 0.5;
  }
}
