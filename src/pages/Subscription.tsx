import { useState } from "react";
import { Check, CreditCard, Building2, Sparkles, ShieldCheck, Lock, Wallet, Smartphone } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Tier {
  id: "free" | "pro" | "enterprise";
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const tiers: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    tagline: "For curious users and casual calls.",
    features: [
      "Live deepfake detection",
      "rPPG pulse signal",
      "30-second confidence trend",
      "100% on-device, zero data leaves",
      "Up to 30 minutes per session",
    ],
    cta: "Get started",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    cadence: "per month",
    tagline: "For journalists, freelancers, and frequent users.",
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited session length",
      "Session history & exportable reports",
      "Custom alert thresholds",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$49",
    cadence: "per seat / month",
    tagline: "For KYC teams, newsrooms, and security ops.",
    features: [
      "Everything in Pro",
      "SSO + role-based access",
      "Team admin & audit log",
      "Detection API + webhooks",
      "SLA & dedicated support",
    ],
    cta: "Talk to sales",
  },
];

const Subscription = () => {
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const onSelect = (t: Tier) => {
    if (t.id === "free") {
      toast.success("You're on Free", { description: "Open the detector and start using it." });
      return;
    }
    if (t.id === "enterprise") {
      window.location.href = "/contact";
      return;
    }
    setSelectedTier(t);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setSelectedTier(null);
      toast.success(`Successfully subscribed to ${selectedTier?.name}!`, {
        description: `Payment processed via ${paymentMethod === 'easypaisa' ? 'EasyPaisa' : paymentMethod === 'jazzcash' ? 'JazzCash' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Card'}.`
      });
    }, 1500);
  };

  return (
    <PageShell
      eyebrow="Pricing"
      title="Pick the plan that fits the threat model."
      description="Every plan runs the same on-device detection engine. Higher tiers add session history, team controls, and an API."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={
              t.highlight
                ? "relative rounded-3xl border-2 border-primary bg-card p-8 shadow-elevated"
                : "rounded-3xl border border-border bg-card p-8 shadow-card"
            }
          >
            {t.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary-foreground shadow-glow">
                Most popular
              </span>
            )}
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.name}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-5xl">{t.price}</span>
              <span className="text-sm text-muted-foreground">{t.cadence}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.tagline}</p>
            <ul className="mt-6 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-trust" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              variant={t.highlight ? "default" : "outline"}
              className={`mt-8 w-full ${t.highlight ? "shadow-glow" : ""}`}
              onClick={() => onSelect(t)}
            >
              {t.cta}
            </Button>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <section className="mt-20 rounded-3xl border border-border bg-card p-10 shadow-elevated md:p-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-trust" />
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-trust">Secure checkout</p>
            </div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">Flexible & Secure Checkout.</h2>
            <p className="mt-4 text-muted-foreground">
              Live card payments are processed securely by Stripe. We also support direct bank transfers and local mobile wallets for Pakistani users. Your details never touch our servers.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { icon: CreditCard, label: "Visa / Mastercard / Amex" },
                { icon: Wallet, label: "Apple Pay & Google Pay" },
                { icon: Building2, label: "Bank Transfer" },
                { icon: Smartphone, label: "EasyPaisa & JazzCash" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs text-muted-foreground">
                  <m.icon className="h-3.5 w-3.5 text-primary" /> {m.label}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ShieldCheck, t: "PCI-DSS Level 1", d: "Stripe handles all card data." },
              { icon: Sparkles, t: "Cancel anytime", d: "No long-term contracts." },
              { icon: Lock, t: "3D Secure", d: "Strong customer authentication." },
              { icon: CreditCard, t: "Refundable", d: "Pro plans refundable within 14 days." },
            ].map((b) => (
              <div key={b.t} className="rounded-2xl border border-border bg-background p-5">
                <b.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 font-display text-lg leading-tight">{b.t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-20">
        <h2 className="font-display text-3xl md:text-4xl">Frequently asked.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { q: "Can I switch plans?", a: "Yes — upgrade or downgrade anytime. Changes prorate to the day." },
            { q: "Is the Free plan really free?", a: "Yes. No card required. Sessions are capped at 30 minutes." },
            { q: "Do you ever upload video?", a: "Never. All AI inference happens in your browser, on every plan." },
            { q: "Which cards are accepted?", a: "Visa, Mastercard, Amex, plus Apple Pay & Google Pay via Stripe." },
          ].map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="font-display text-lg">{f.q}</p>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Checkout Modal */}
      <Dialog open={!!selectedTier} onOpenChange={(open) => !open && setSelectedTier(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Subscribe to {selectedTier?.name}</DialogTitle>
            <DialogDescription>
              {selectedTier?.price} {selectedTier?.cadence}. Cancel anytime.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckout}>
            <div className="grid gap-4 py-4">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-3 text-xs hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <CreditCard className="mb-2 h-5 w-5" />
                    Card
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                  <Label
                    htmlFor="bank"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-3 text-xs hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Building2 className="mb-2 h-5 w-5" />
                    Bank
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="easypaisa" id="easypaisa" className="peer sr-only" />
                  <Label
                    htmlFor="easypaisa"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-3 text-center text-xs hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Smartphone className="mb-2 h-5 w-5" />
                    EasyPaisa
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="jazzcash" id="jazzcash" className="peer sr-only" />
                  <Label
                    htmlFor="jazzcash"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-3 text-center text-xs hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Smartphone className="mb-2 h-5 w-5" />
                    JazzCash
                  </Label>
                </div>
              </RadioGroup>

              <div className="rounded-xl border border-border bg-accent/30 p-4">
                {paymentMethod === "card" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="card-number" className="text-xs">Card number</Label>
                      <Input id="card-number" placeholder="0000 0000 0000 0000" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="expiry" className="text-xs">Expiry</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cvc" className="text-xs">CVC</Label>
                        <Input id="cvc" placeholder="123" required />
                      </div>
                    </div>
                  </div>
                )}
                {paymentMethod === "bank" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Transfer to our local bank account. Your subscription will activate once funds clear.</p>
                    <div className="space-y-1">
                      <Label className="text-xs">IBAN</Label>
                      <div className="font-mono text-sm">PK36 MEZN 0001 2345 6789 0123</div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tx-id" className="text-xs">Transaction ID (Reference)</Label>
                      <Input id="tx-id" placeholder="e.g. 123456789" required />
                    </div>
                  </div>
                )}
                {(paymentMethod === "easypaisa" || paymentMethod === "jazzcash") && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Enter your {paymentMethod === "easypaisa" ? "EasyPaisa" : "JazzCash"} mobile number. You'll receive a prompt on your phone to authorize.
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="mobile-number" className="text-xs">Mobile Number</Label>
                      <Input id="mobile-number" type="tel" placeholder="03XX XXXXXXX" required />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isProcessing}>
                {isProcessing ? "Processing..." : `Pay ${selectedTier?.price}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default Subscription;
