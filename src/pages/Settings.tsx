import { useEffect, useState } from "react";
import { Sliders, Activity, ShieldCheck, Eye, Save, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export interface LayerWeights {
  spatial: number;
  temporal: number;
  biological: number;
  frequency: number;
  pose: number;
  ocular: number;
  anatomy: number;
  spectral: number;
}

export interface Prefs {
  alertThreshold: number;
  alertSound: boolean;
  showLandmarks: boolean;
  showPulseRoi: boolean;
  preferGpu: boolean;

  // Item 2: 8-Layer Modality Weight Tuning
  layerWeights: LayerWeights;

  // Item 3: Biometric Baselines & Sensitivity Calibration
  sensitivityPreset: "relaxed" | "standard" | "strict";
  rppgWindowSeconds: 4 | 8 | 12;
}

export const DEFAULTS: Prefs = {
  alertThreshold: 50,
  alertSound: true,
  showLandmarks: true,
  showPulseRoi: true,
  preferGpu: true,

  layerWeights: {
    spatial: 15,
    temporal: 10,
    biological: 15,
    frequency: 5,
    pose: 10,
    ocular: 15,
    anatomy: 15,
    spectral: 15,
  },

  sensitivityPreset: "relaxed",
  rppgWindowSeconds: 8,
};

export const SETTINGS_STORAGE_KEY = "dfs.prefs.v1";

export function loadSettingsFromStorage(): Prefs {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULTS,
        ...parsed,
        layerWeights: { ...DEFAULTS.layerWeights, ...(parsed.layerWeights || {}) },
      };
    }
  } catch {
    /* fallback */
  }
  return DEFAULTS;
}

const Settings = () => {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    setPrefs(loadSettingsFromStorage());
  }, []);

  const update = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v }));

  const updateWeight = (layer: keyof LayerWeights, value: number) => {
    setPrefs((p) => ({
      ...p,
      layerWeights: {
        ...p.layerWeights,
        [layer]: value,
      },
    }));
  };

  const totalWeight = Object.values(prefs.layerWeights).reduce((a, b) => a + b, 0);

  const save = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(prefs));
    toast.success("Industrial settings saved", { description: "Biometric baselines and modality weights stored on device." });
  };

  const reset = () => {
    setPrefs(DEFAULTS);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    toast("Settings reset to defaults");
  };

  return (
    <PageShell
      eyebrow="Forensic Control"
      title="Deepfake Shield Preferences"
      description="Calibrate biometric baselines, tune 8-layer modality fusion weights, and configure real-time defense thresholds."
    >
      <div className="space-y-6 sm:space-y-8 font-industrial">
        
        {/* ITEM 3: Biometric Baselines & Sensitivity Calibration */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-7 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary shrink-0" />
              <h2 className="font-industrial text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground">
                Biometric Baselines & Sensitivity Calibration
              </h2>
            </div>
            <span className="font-industrialMono text-[10px] sm:text-xs uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded bg-primary/10 text-primary border border-primary/30 font-semibold shrink-0">
              CALIBRATION MODULE v2.4
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <div className="space-y-3">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4 text-trust shrink-0" /> Detector Sensitivity Preset
              </Label>
              <p className="text-xs text-muted-foreground">
                Adjust threshold tolerances for room lighting, camera sensor noise, and security stringency.
              </p>
              <Tabs
                value={prefs.sensitivityPreset}
                onValueChange={(v) => update("sensitivityPreset", v as Prefs["sensitivityPreset"])}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="relaxed" className="text-[10px] sm:text-xs font-industrial uppercase font-semibold px-1 sm:px-3 py-1.5"><span className="hidden sm:inline">Relaxed (Webcam)</span><span className="sm:hidden">Relaxed</span></TabsTrigger>
                  <TabsTrigger value="standard" className="text-[10px] sm:text-xs font-industrial uppercase font-semibold px-1 sm:px-3 py-1.5">Standard</TabsTrigger>
                  <TabsTrigger value="strict" className="text-[10px] sm:text-xs font-industrial uppercase font-semibold px-1 sm:px-3 py-1.5"><span className="hidden sm:inline">Strict (KYC/Defense)</span><span className="sm:hidden">Strict</span></TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="text-xs font-industrialMono text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                {prefs.sensitivityPreset === "relaxed" && (
                  <p><strong className="text-trust font-bold">RELAXED MARGIN:</strong> Tolerates low-light webcam noise and natural head movement. Real threshold ≥ 55%.</p>
                )}
                {prefs.sensitivityPreset === "standard" && (
                  <p><strong className="text-primary font-bold">STANDARD BALANCED:</strong> Balanced baseline for HD video calls and conference streams. Real threshold ≥ 65%.</p>
                )}
                {prefs.sensitivityPreset === "strict" && (
                  <p><strong className="text-danger font-bold font-industrial">STRICT DEFENSE:</strong> High-security identity verification & financial KYC stringency. Real threshold ≥ 75%.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                <Activity className="h-4 w-4 text-primary shrink-0" /> rPPG Cardiac Window Duration
              </Label>
              <p className="text-xs text-muted-foreground">
                Time window buffer used to accumulate sub-dermal capillary pulse signals.
              </p>
              <Tabs
                value={String(prefs.rppgWindowSeconds)}
                onValueChange={(v) => update("rppgWindowSeconds", Number(v) as Prefs["rppgWindowSeconds"])}
                className="w-full"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="4" className="text-[10px] sm:text-xs font-industrial uppercase font-semibold px-1 sm:px-3 py-1.5"><span className="hidden sm:inline">4s (Fast Lock)</span><span className="sm:hidden">4s Fast</span></TabsTrigger>
                  <TabsTrigger value="8" className="text-[10px] sm:text-xs font-industrial uppercase font-semibold px-1 sm:px-3 py-1.5"><span className="hidden sm:inline">8s (Clinical Default)</span><span className="sm:hidden">8s Default</span></TabsTrigger>
                  <TabsTrigger value="12" className="text-[10px] sm:text-xs font-industrial uppercase font-semibold px-1 sm:px-3 py-1.5"><span className="hidden sm:inline">12s (Deep Research)</span><span className="sm:hidden">12s Deep</span></TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="text-xs font-industrialMono text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                {prefs.rppgWindowSeconds === 4 && <p>⚡ Fast pulse accumulation. Recommended for quick screening tests.</p>}
                {prefs.rppgWindowSeconds === 8 && <p>🩺 Standard clinical precision window balancing speed and signal stability.</p>}
                {prefs.rppgWindowSeconds === 12 && <p>🔬 Maximum signal-to-noise ratio for research-grade forensic evidence acquisition.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* ITEM 2: 8-Layer Modality Weight Tuning */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-7 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary shrink-0" />
              <h2 className="font-industrial text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground">
                8-Layer Modality Weight Tuning
              </h2>
            </div>
            <div className={`flex items-center gap-2 font-industrialMono text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${totalWeight === 100 ? "bg-trust/10 border-trust/40 text-trust" : "bg-amber-500/10 border-amber-500/40 text-amber-500"}`}>
              {totalWeight === 100 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              <span className="tracking-wider">TOTAL FUSION WEIGHT: {totalWeight}%</span>
            </div>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
            Customize the fusion influence assigned to each of the 8 biological, physical, and spectral neural analysis layers during evaluation.
          </p>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mt-6">
            <WeightSlider label="Layer 1: Spatial CNN (MobileNet)" layer="spatial" val={prefs.layerWeights.spatial} color="bg-blue-500" onChange={updateWeight} />
            <WeightSlider label="Layer 2: Temporal Motion Continuity" layer="temporal" val={prefs.layerWeights.temporal} color="bg-purple-500" onChange={updateWeight} />
            <WeightSlider label="Layer 3: Biological rPPG Pulse" layer="biological" val={prefs.layerWeights.biological} color="bg-trust" onChange={updateWeight} />
            <WeightSlider label="Layer 4: Micro-Frequency Variance" layer="frequency" val={prefs.layerWeights.frequency} color="bg-amber-500" onChange={updateWeight} />
            <WeightSlider label="Layer 5: 3D Head Pose Stability" layer="pose" val={prefs.layerWeights.pose} color="bg-pink-500" onChange={updateWeight} />
            <WeightSlider label="Layer 6: Ocular Dynamics & Blink" layer="ocular" val={prefs.layerWeights.ocular} color="bg-cyan-500" onChange={updateWeight} />
            <WeightSlider label="Layer 7: Anatomical Mesh Geometry" layer="anatomy" val={prefs.layerWeights.anatomy} color="bg-rose-500" onChange={updateWeight} />
            <WeightSlider label="Layer 8: Spectral Diffusion Noise" layer="spectral" val={prefs.layerWeights.spectral} color="bg-indigo-500" onChange={updateWeight} />
          </div>
        </div>

        {/* Existing Controls: Alert Threshold & Overlays */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card icon={ShieldCheck} title="ALERT THRESHOLD" description="Trigger low-trust alert when score stays below this threshold for 5 seconds.">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground uppercase tracking-wider text-xs">Score Threshold</Label>
              <span className="font-industrialMono text-2xl sm:text-3xl font-extrabold text-primary">{prefs.alertThreshold}%</span>
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

          <Card icon={Eye} title="OVERLAY & PERFORMANCE" description="Customize video feed visual overlays and hardware acceleration.">
            <Row label="Show 468 Face Mesh Landmarks">
              <Switch checked={prefs.showLandmarks} onCheckedChange={(v) => update("showLandmarks", v)} />
            </Row>
            <Row label="Show Pulse ROI Forehead Box">
              <Switch checked={prefs.showPulseRoi} onCheckedChange={(v) => update("showPulseRoi", v)} />
            </Row>
            <Row label="Audible Warning Sound">
              <Switch checked={prefs.alertSound} onCheckedChange={(v) => update("alertSound", v)} />
            </Row>
          </Card>
        </div>

        {/* Save & Reset Actions */}
        <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 pt-4 border-t border-border">
          <Button onClick={save} size="lg" className="shadow-glow flex items-center justify-center gap-2 font-industrial uppercase tracking-wider font-bold text-xs sm:text-sm">
            <Save className="h-4 w-4" /> Save Industrial Preferences
          </Button>
          <Button onClick={reset} size="lg" variant="outline" className="flex items-center justify-center gap-2 font-industrial uppercase tracking-wider font-semibold text-xs sm:text-sm">
            <RotateCcw className="h-4 w-4" /> Reset to Defaults
          </Button>
        </div>

      </div>
    </PageShell>
  );
};

const Card = ({ icon: Icon, title, description, children }: { icon: typeof Eye; title: string; description: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-7 shadow-card">
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <p className="font-industrialMono text-xs uppercase tracking-widest text-muted-foreground font-semibold">System Setting</p>
    </div>
    <h3 className="mt-3 font-industrial text-xl font-bold uppercase tracking-wide">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    <div className="mt-6 space-y-4">{children}</div>
  </div>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
    <Label className="text-sm font-semibold uppercase tracking-wide">{label}</Label>
    {children}
  </div>
);

const WeightSlider = ({
  label,
  layer,
  val,
  color,
  onChange,
}: {
  label: string;
  layer: keyof LayerWeights;
  val: number;
  color: string;
  onChange: (layer: keyof LayerWeights, value: number) => void;
}) => (
  <div className="p-4 rounded-xl border border-border bg-background space-y-2">
    <div className="flex justify-between items-center text-sm">
      <span className="font-industrial font-semibold text-foreground uppercase tracking-wide flex items-center gap-2 text-xs">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-industrialMono text-xs font-bold text-primary">{val}%</span>
    </div>
    <Slider
      value={[val]}
      onValueChange={(v) => onChange(layer, v[0])}
      min={0}
      max={40}
      step={1}
      className="py-1"
    />
  </div>
);

export default Settings;
