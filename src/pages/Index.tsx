import { Link } from "react-router-dom";
import { ArrowRight, Activity, Cpu, Eye, Lock, Sparkles, Waves, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const features = [
  { icon: Eye, title: "Visual artifact detection", desc: "Per-frame analysis of facial landmarks identifies the geometric tells of GAN and diffusion-generated faces." },
  { icon: Activity, title: "rPPG liveness", desc: "Remote photoplethysmography reads the faint pulse in your skin from the green channel — synthetic faces don't have one." },
  { icon: Lock, title: "Zero-leak architecture", desc: "All inference runs locally via WebAssembly and WebGPU. Your video never touches a server." },
  { icon: Zap, title: "20+ FPS realtime", desc: "Optimised for live calls. Sub-50 ms verdicts so the trust meter stays in sync with what you see." },
  { icon: Cpu, title: "Hybrid decision engine", desc: "Visual confidence and biological pulse confidence are fused into a single, explainable Trust Score." },
  { icon: Sparkles, title: "Built for humans", desc: "Calm, advisory UI. No false alarms screaming. Just a clear signal you can act on." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="container relative grid gap-8 sm:gap-12 py-12 sm:py-20 md:py-28 px-4 sm:px-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-card backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trust opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-trust" />
              </span>
              Live · on-device · privacy-preserving
            </div>
            <h1 className="mt-4 sm:mt-6 font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight md:text-7xl">
              The person on the call.
              <br />
              <span className="text-primary">Are they real?</span>
            </h1>
            <p className="mt-4 sm:mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Deepfake Shield is a browser-based detector that watches every frame of your video call for the
              fingerprints of synthetic faces — and confirms human presence by reading the pulse in your skin.
            </p>
            <div className="mt-6 sm:mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              <Button asChild size="lg" className="h-11 sm:h-12 px-6 sm:px-7 text-sm sm:text-base shadow-glow w-full sm:w-auto justify-center">
                <Link to="/detect">
                  Launch detector <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-11 sm:h-12 px-4 sm:px-5 text-sm sm:text-base w-full sm:w-auto justify-center">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <dl className="mt-8 sm:mt-12 grid max-w-lg grid-cols-3 gap-3 sm:gap-6 border-t border-border pt-6">
              <div>
                <dt className="font-display text-2xl sm:text-3xl text-foreground">20<span className="text-primary">fps</span></dt>
                <dd className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">Live throughput</dd>
              </div>
              <div>
                <dt className="font-display text-2xl sm:text-3xl text-foreground">0<span className="text-primary">B</span></dt>
                <dd className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">Sent to server</dd>
              </div>
              <div>
                <dt className="font-display text-2xl sm:text-3xl text-foreground">2<span className="text-primary">×</span></dt>
                <dd className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">Detection signals</dd>
              </div>
            </dl>
          </div>

          {/* hero visual */}
          <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-border/60 bg-card">
        <div className="container py-12 sm:py-20 md:py-28 px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">The pipeline</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl">Two signals. One verdict.</h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground">
              Every frame from your webcam runs through two parallel pipelines. The Decision Engine fuses them into a single Trust Score.
            </p>
          </div>
          <div className="mt-12 sm:mt-16 grid gap-6 md:grid-cols-3">
            {[
              { step: "01", icon: Eye, title: "Capture & landmark", desc: "MediaPipe extracts 478 facial landmarks per frame at 30 fps, fully on-device." },
              { step: "02", icon: Waves, title: "rPPG pulse", desc: "Forehead and cheek ROIs are sampled. Green-channel intensity over time reveals heart rate." },
              { step: "03", icon: ShieldCheck, title: "Trust verdict", desc: "Visual artifact score + pulse confidence → calibrated Trust Score with a clear human/AI verdict." },
            ].map((s) => (
              <div key={s.step} className="group relative rounded-2xl border border-border bg-background p-5 sm:p-7 shadow-card transition-all hover:shadow-elevated">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-muted-foreground">{s.step}</span>
                  <s.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 sm:mt-6 font-display text-xl sm:text-2xl">{s.title}</h3>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-border/60">
        <div className="container py-12 sm:py-20 md:py-28 px-4 sm:px-6">
          <div className="grid gap-8 sm:gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Capabilities</p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl md:text-5xl">Engineered for live, high-stakes calls.</h2>
              <p className="mt-4 text-sm sm:text-base text-muted-foreground">
                Built for journalists, executives, KYC teams, and anyone who needs to know — right now — whether the face on screen is human.
              </p>
            </div>
            <div className="lg:col-span-8">
              <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title} className="bg-card p-5 sm:p-7 transition-colors hover:bg-accent/40">
                    <f.icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
                    <h3 className="mt-4 sm:mt-5 font-display text-lg sm:text-xl">{f.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section id="privacy" className="relative overflow-hidden border-t border-border/60 bg-card">
        <div className="container py-12 sm:py-20 md:py-28 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-background p-5 sm:p-10 md:p-14 shadow-elevated">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-trust shrink-0" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-trust">Privacy by architecture</p>
            </div>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl md:text-5xl">Your face never leaves this tab.</h2>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
              There is no upload step. No "encrypted in transit". No backend at all for video. The neural network,
              the pulse extractor, and the decision logic are all bundled into the page you're reading.
              When you close the tab, nothing remains.
            </p>
            <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              {[
                ["WebGPU", "Local GPU inference"],
                ["WebAssembly", "Native-speed rPPG"],
                ["IndexedDB", "Models cached on-device"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-mono text-xs uppercase tracking-wider text-primary">{k}</p>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="container py-12 sm:py-20 md:py-28 text-center px-4 sm:px-6">
          <h2 className="mx-auto max-w-2xl font-display text-3xl sm:text-4xl md:text-6xl">
            Trust your eyes again.
          </h2>
          <p className="mx-auto mt-4 sm:mt-5 max-w-lg text-sm sm:text-base text-muted-foreground">
            Open your webcam and watch the Trust Meter come alive. No sign-up. No download.
          </p>
          <Button asChild size="lg" className="mt-7 sm:mt-9 h-11 sm:h-12 px-7 sm:px-8 text-sm sm:text-base shadow-glow w-full sm:w-auto">
            <Link to="/detect">
              Launch the detector <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

const HeroVisual = () => (
  <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
    <div className="absolute inset-0 rounded-[28px] gradient-primary opacity-20 blur-2xl" />
    <div className="relative h-full overflow-hidden rounded-[28px] border border-border bg-card shadow-elevated">
      {/* mock detection panel */}
      <div className="flex items-center justify-between border-b border-border bg-background/60 px-5 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        <span>● live · 1080p</span>
        <span className="text-trust">verified human</span>
      </div>
      <div className="relative h-[58%] overflow-hidden bg-gradient-to-b from-muted to-card">
        {/* face wireframe placeholder */}
        <svg viewBox="0 0 200 240" className="absolute inset-0 m-auto h-full w-full opacity-90">
          <defs>
            <radialGradient id="g" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity="0.25" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="110" rx="55" ry="70" fill="url(#g)" />
          <ellipse cx="100" cy="110" rx="55" ry="70" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.6" strokeDasharray="2 3" />
          {Array.from({ length: 20 }).map((_, i) => (
            <circle key={i} cx={60 + (i % 5) * 20} cy={70 + Math.floor(i / 5) * 22} r="1.2" fill="hsl(var(--primary))" />
          ))}
          <path d="M70 95 Q100 105 130 95" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M75 145 Q100 158 125 145" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" opacity="0.5" />
        </svg>
        {/* scanning line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
      </div>
      {/* trust meter */}
      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase tracking-wider text-muted-foreground">Trust score</span>
            <span className="font-display text-2xl text-trust">94</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[94%] rounded-full gradient-trust" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pulse · rPPG</p>
            <p className="font-display text-xl">72 <span className="text-sm text-muted-foreground">bpm</span></p>
          </div>
          <svg viewBox="0 0 100 28" className="h-8 w-32">
            <path d="M0 14 L15 14 L20 6 L25 22 L30 14 L45 14 L50 8 L55 20 L60 14 L100 14"
              fill="none" stroke="hsl(var(--trust))" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

export default Index;
