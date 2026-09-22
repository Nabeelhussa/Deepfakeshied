import { Award, Cpu, GraduationCap, Lock, Target } from "lucide-react";
import { PageShell } from "@/components/PageShell";

const team = [
  { name: "Nabeel Hussain", role: "ML & rPPG pipeline", roll: "FA22-BSE-048" },
  { name: "Faizan Alam", role: "Frontend & UX", roll: "FA22-BSE-056" },
  { name: "Arman Akram", role: "WebAssembly & perf", roll: "FA22-BSE-062" },
  { name: "Ali Haider", role: "Detection & QA", roll: "FA22-BSE-069" },
];

const About = () => (
  <PageShell
    eyebrow="About"
    title="A defence layer for the post-truth video call."
    description="Deepfake Shield is a privacy-preserving, browser-based detector built at Mirpur University of Science and Technology to fight synthetic-identity fraud — without sending a single frame to the cloud."
  >
    <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
      {[
        { icon: Target, title: "Mission", body: "Make real-time deepfake detection accessible to journalists, KYC teams, and everyday users — for free, in the browser." },
        { icon: Lock, title: "Principles", body: "Privacy by architecture. Honest, advisory UI. No dark patterns, no data harvesting, no surprise uploads." },
        { icon: Cpu, title: "Approach", body: "Two parallel pipelines — visual artifact analysis and rPPG-based liveness — fused into one calibrated Trust Score." },
      ].map((c) => (
        <div key={c.title} className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-card">
          <c.icon className="h-6 w-6 text-primary" />
          <h3 className="mt-4 sm:mt-5 font-display text-xl sm:text-2xl">{c.title}</h3>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">{c.body}</p>
        </div>
      ))}
    </div>

    <section className="mt-12 sm:mt-20">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary shrink-0" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">The team</p>
      </div>
      <h2 className="mt-2 sm:mt-3 font-display text-2xl sm:text-3xl md:text-4xl">Built by four BSE students at MUST.</h2>
      <div className="mt-8 sm:mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {team.map((p) => (
          <div key={p.roll} className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-primary text-primary-foreground">
              <span className="font-display text-lg">{p.name.split(" ").map((n) => n[0]).join("")}</span>
            </div>
            <p className="mt-4 font-display text-base sm:text-lg">{p.name}</p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{p.role}</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.roll}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="mt-12 sm:mt-20 rounded-3xl border border-border bg-card p-5 sm:p-10 md:p-14 shadow-elevated">
      <Award className="h-6 w-6 text-trust" />
      <h2 className="mt-3 sm:mt-4 font-display text-2xl sm:text-3xl md:text-4xl">Aligned with the UN Sustainable Development Goals.</h2>
      <p className="mt-3 sm:mt-4 max-w-2xl text-xs sm:text-base leading-relaxed text-muted-foreground">
        Deepfake Shield contributes to <strong>SDG 16</strong> (Peace, Justice & Strong Institutions) by helping
        prevent digital identity fraud, and <strong>SDG 9</strong> (Industry, Innovation & Infrastructure) by advancing
        privacy-preserving AI security infrastructure for global communication.
      </p>
    </section>
  </PageShell>
);

export default About;
