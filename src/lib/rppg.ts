/**
 * rPPG (remote photoplethysmography) — extract a heart-rate-like pulse signal
 * from skin color variations across the green channel.
 *
 * Approach: maintain a sliding buffer of mean-green values from the cheek/forehead ROI,
 * detrend, band-pass [0.7..3.5 Hz] (~42–210 bpm), and pick the dominant frequency.
 */

const FS_TARGET = 30; // target sample rate
const WINDOW_SECONDS = 8;
const BUFFER_SIZE = FS_TARGET * WINDOW_SECONDS;

export class RPPGEstimator {
  private samples: { t: number; r: number; g: number; b: number }[] = [];

  push(r: number, g: number, b: number, t: number) {
    this.samples.push({ t, r, g, b });
    if (this.samples.length > BUFFER_SIZE * 2) {
      this.samples.splice(0, this.samples.length - BUFFER_SIZE * 2);
    }
  }

  /** Return current ~normalized pulse waveform (last N samples, mean-removed) */
  waveform(n = 120): number[] {
    const slice = this.samples.slice(-n);
    if (slice.length < 8) return [];
    
    // Chrominance-based noise reduction (Simple POS/CHROM derivative)
    // Green absorbs blood, Red mostly reflects skin surface (lighting noise)
    const meanG = slice.reduce((a, s) => a + s.g, 0) / slice.length;
    const meanR = slice.reduce((a, s) => a + s.r, 0) / slice.length;
    
    const arr = slice.map((s) => {
      const gNorm = s.g / (meanG || 1);
      const rNorm = s.r / (meanR || 1);
      return gNorm - rNorm; // Subtract out the lighting noise
    });
    
    const max = Math.max(1e-6, ...arr.map(Math.abs));
    return arr.map((v) => v / max);
  }

  /** Estimate BPM + signal confidence (0..1) from current buffer */
  estimate(): { bpm: number | null; confidence: number } {
    const s = this.samples;
    if (s.length < FS_TARGET * 4) return { bpm: null, confidence: 0 };

    const t0 = s[0].t;
    const tN = s[s.length - 1].t;
    const duration = (tN - t0) / 1000;
    if (duration < 3) return { bpm: null, confidence: 0 };

    // Resample evenly
    const N = Math.min(BUFFER_SIZE, Math.floor(duration * FS_TARGET));
    const fs = N / duration;
    
    const rXs = new Float32Array(N);
    const gXs = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const t = t0 + (i / (N - 1)) * (tN - t0);
      let lo = 0, hi = s.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (s[mid].t < t) lo = mid;
        else hi = mid;
      }
      const span = s[hi].t - s[lo].t || 1;
      const f = (t - s[lo].t) / span;
      rXs[i] = s[lo].r * (1 - f) + s[hi].r * f;
      gXs[i] = s[lo].g * (1 - f) + s[hi].g * f;
    }

    // Detrend and Combine (POS derivative)
    let meanR = 0, meanG = 0;
    for (let i = 0; i < N; i++) { meanR += rXs[i]; meanG += gXs[i]; }
    meanR /= N; meanG /= N;
    
    const xs = new Float32Array(N);
    for (let i = 0; i < N; i++) {
       const normR = rXs[i] / (meanR || 1);
       const normG = gXs[i] / (meanG || 1);
       xs[i] = normG - normR; // Artifact reduction signal
    }

    // High-Pass Filter: Subtract a 1.5-second moving average to remove slow 
    // auto-white-balance drift which causes false readings at the 45 BPM boundary.
    const hpfWindow = Math.floor(fs * 0.75); // Half-window for +/- 0.75s (1.5s total)
    const filteredXs = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - hpfWindow); j <= Math.min(N - 1, i + hpfWindow); j++) {
        sum += xs[j];
        count++;
      }
      filteredXs[i] = xs[i] - (sum / count);
    }

    // Hann window
    for (let i = 0; i < N; i++) {
      const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1));
      filteredXs[i] *= w;
    }

    // Goertzel-style scan over BPM range (0.7–3.5 Hz)
    const minBpm = 45;
    const maxBpm = 180;
    let bestBpm = -1;
    let bestPower = 0;
    let totalPower = 0;
    for (let bpm = minBpm; bpm <= maxBpm; bpm += 1) {
      const f = bpm / 60;
      const omega = (2 * Math.PI * f) / fs;
      let re = 0,
        im = 0;
      for (let i = 0; i < N; i++) {
        re += filteredXs[i] * Math.cos(omega * i);
        im += filteredXs[i] * Math.sin(omega * i);
      }
      const power = re * re + im * im;
      totalPower += power;
      if (power > bestPower) {
        bestPower = power;
        bestBpm = bpm;
      }
    }
    const ratio = totalPower > 0 ? bestPower / (totalPower / (maxBpm - minBpm + 1)) : 0;
    // confidence: how much the peak dominates the average bin power
    const confidence = Math.max(0, Math.min(1, (ratio - 1) / 8));
    return { bpm: bestBpm, confidence };
  }

  reset() {
    this.samples = [];
  }
}
