import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Subscription", to: "/subscription" },
  { label: "Settings", to: "/settings" },
];

export const SiteHeader = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg gradient-primary shadow-glow">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" strokeWidth={2.25} />
          </span>
          <span className="font-display text-base sm:text-lg font-medium tracking-tight">
            Deepfake<span className="text-primary"> Shield</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-sm transition-colors",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant={pathname === "/detect" ? "secondary" : "default"} className="hidden sm:inline-flex text-xs sm:text-sm">
            <Link to="/detect">Launch detector</Link>
          </Button>
          <button
            type="button"
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card md:hidden"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-lg md:hidden animate-fade-up">
          <div className="container flex flex-col gap-1.5 py-4 px-4 sm:px-6">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground hover:bg-muted/60"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Button asChild size="sm" className="mt-3 w-full shadow-glow" onClick={() => setOpen(false)}>
              <Link to="/detect">Launch detector</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
