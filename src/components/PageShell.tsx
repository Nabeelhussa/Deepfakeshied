import { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export const PageShell = ({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <div className="min-h-screen bg-background">
    <SiteHeader />
    <section className="border-b border-border/60 gradient-hero">
      <div className="container py-10 sm:py-14 md:py-20 px-4 sm:px-6">
        {eyebrow && <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl font-display text-3xl sm:text-4xl leading-[1.08] md:text-6xl tracking-tight">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground">{description}</p>}
      </div>
    </section>
    <main className="container py-8 sm:py-12 md:py-16 px-4 sm:px-6">{children}</main>
    <SiteFooter />
  </div>
);
