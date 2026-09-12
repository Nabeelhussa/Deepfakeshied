import { useEffect, useState } from "react";
import { Bell, Cpu, Eye, Save, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Prefs {
  alertThreshold: number;
  alertSound: boolean;
  showLandmarks: boolean;
  showPulseRoi: boolean;
  preferGpu: boolean;
}

const DEFAULTS: Prefs = {
  alertThreshold: 50,
  alertSound: true,
  showLandmarks: true,
  showPulseRoi: true,
  preferGpu: true,
};

const KEY = "dfs.prefs.v1";

const Settings = () => {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v }));

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    toast.success("Settings saved", { description: "Your preferences are stored on this device." });
  };

  const reset = () => {
    setPrefs(DEFAULTS);
    localStorage.removeItem(KEY);
    toast("Settings reset to defaults");
  };

  return (
    <PageShell
      eyebrow="Settings"
      title="Tune the detector."
      description="All preferences live on this device. Nothing is synced to a server."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card icon={ShieldCheck} title="Alert threshold" description="Trigger a sustained-low-trust alert when the score stays below this for 5 seconds.">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Score</Label>
            <span className="font-display text-3xl">{prefs.alertThreshold}</span>
          </div>
          <Slider
            value={[prefs.alertThreshold]}
            onValueChange={(v) => update("alertThreshold", v[0])}
            min={10}
            max={90}
            step={1}
            className="mt-4"
          />
        </Card>

        <Card icon={Bell} title="Alert sound" description="Play a soft chime when an alert fires. Visual indicators always show.">
          <Row label="Audible alerts">
            <Switch checked={prefs.alertSound} onCheckedChange={(v) => update("alertSound", v)} />
          </Row>
        </Card>

        <Card icon={Eye} title="Overlay options" description="Choose what you see on top of the video feed.">
          <Row label="Show face landmarks">
            <Switch checked={prefs.showLandmarks} onCheckedChange={(v) => update("showLandmarks", v)} />
          </Row>
          <Row label="Show pulse ROI box">
            <Switch checked={prefs.showPulseRoi} onCheckedChange={(v) => update("showPulseRoi", v)} />
          </Row>
        </Card>

        <Card icon={Cpu} title="Performance" description="GPU inference is faster but may not be available on every device.">
          <Row label="Prefer WebGPU">
            <Switch checked={prefs.preferGpu} onCheckedChange={(v) => update("preferGpu", v)} />
          </Row>
        </Card>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button onClick={save} size="lg" className="shadow-glow">
          <Save className="mr-2 h-4 w-4" /> Save preferences
        </Button>
        <Button onClick={reset} size="lg" variant="ghost">Reset to defaults</Button>
      </div>
    </PageShell>
  );
};

const Card = ({ icon: Icon, title, description, children }: { icon: typeof Eye; title: string; description: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-7 shadow-card">
    <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Setting</p></div>
    <h3 className="mt-3 font-display text-2xl">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    <div className="mt-6 space-y-4">{children}</div>
  </div>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

export default Settings;
