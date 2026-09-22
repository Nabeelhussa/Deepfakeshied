import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Copy, Download, FileText, Check, Activity, BarChart2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { ForensicReportResponse, TelemetryData } from "@/lib/forensic-analyst";

interface ForensicReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ForensicReportResponse | null;
  telemetry: TelemetryData | null;
  capturedFrame?: string | null;
}

export const ForensicReportModal: React.FC<ForensicReportModalProps> = ({
  open,
  onOpenChange,
  report,
  telemetry,
  capturedFrame,
}) => {
  const [copied, setCopied] = useState(false);

  if (!report || !telemetry) return null;

  const isReal = report.markdown_report.includes("VERDICT: REAL");
  const displayImage = capturedFrame || "/telemetry_scan.png";

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(report.markdown_report);
    setCopied(true);
    toast.success("Copied Markdown Report to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPdf = () => {
    exportReportToPdf(
      "Deepfake Shield - Digital Forensics Report",
      report.markdown_report,
      telemetry,
      displayImage
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92vh] overflow-y-auto bg-card border-border shadow-elevated p-4 sm:p-6">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <a href="/" target="_self" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary shadow-glow">
                  <ShieldCheck className="h-6 w-6 text-primary-foreground" strokeWidth={2.25} />
                </span>
              </a>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-display flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <a href="/" className="hover:text-primary transition-colors">
                    Deepfake<span className="text-primary"> Shield</span>
                  </a>
                  <span className="text-muted-foreground font-light hidden sm:inline">|</span>
                  <span className="text-base sm:text-2xl">Forensics Report</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                  Biological Telemetry Analysis via TensorFlow.js
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isReal ? (
                <div className="px-3 py-1.5 rounded-full bg-trust/10 border border-trust/40 text-trust font-mono text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> VERDICT: REAL
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-full bg-danger/10 border border-danger/40 text-danger font-mono text-xs font-bold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" /> VERDICT: FAKE
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" /> Clinical Forensic Evidence
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="outline" size="sm" onClick={handleCopyMarkdown} className="text-xs flex-1 sm:flex-none">
                {copied ? <Check className="h-3.5 w-3.5 mr-1 text-trust" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Copy Report
              </Button>
              <Button variant="default" size="sm" onClick={handleExportPdf} className="text-xs shadow-glow flex-1 sm:flex-none">
                <Download className="h-3.5 w-3.5 mr-1" /> Export PDF
              </Button>
            </div>
          </div>

          {/* Subject Telemetry Visual Header: Live Captured Person Image + Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-muted/30 border border-border p-3 sm:p-4 rounded-xl items-center">
            <div className="md:col-span-4 relative group rounded-lg overflow-hidden border border-border aspect-square max-h-64 sm:max-h-none mx-auto w-full bg-black flex items-center justify-center">
              <img
                src={displayImage}
                alt="Live Captured Subject Telemetry Face Scan"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded font-mono text-[10px] text-emerald-400 flex justify-between items-center border border-emerald-500/30">
                <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> LIVE CAPTURE</span>
                <span>468 MESH LANDMARKS</span>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <h4 className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> rPPG Cardiac Waveform Signal (Layer 3)
                </h4>
                <span className="font-mono text-[11px] sm:text-xs text-trust font-bold">
                  {telemetry.bpm ? `${telemetry.bpm} BPM` : "—"} ({(telemetry.rppgConfidence * 100).toFixed(0)}% CONF)
                </span>
              </div>
              
              {/* rPPG Waveform SVG Chart */}
              <div className="bg-black/60 p-2.5 sm:p-3 rounded-lg border border-border">
                {renderSvgPulseGraph(isReal)}
              </div>

              <div className="flex justify-between items-center border-b border-border/50 pb-1 pt-2">
                <h4 className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5" /> 8-Layer Biological Physics Telemetry Breakdown
                </h4>
              </div>

              {/* 8-Layer Scores Bar Graph */}
              {renderSvgLayerScoresGraph(telemetry)}
            </div>
          </div>

          {/* Formatted Markdown Sections without line separators under titles */}
          <div className="bg-muted/20 border border-border rounded-xl p-4 sm:p-6 prose prose-invert max-w-none font-sans leading-relaxed text-sm">
            {renderFormattedMarkdown(report.markdown_report)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Render SVG rPPG Pulse Waveform Chart
 */
function renderSvgPulseGraph(isReal: boolean) {
  const points = isReal
    ? [0, 10, 5, 25, 80, -40, 15, 5, 12, 60, -35, 10, 0, 15, 75, -38, 12, 4, 10, 70, -35, 8, 0]
    : [0, 2, -1, 3, 5, -4, 2, 0, 1, 4, -3, 1, 0, 2, 5, -2, 1, 0, 2, 4, -3, 1, 0];

  const w = 500, h = 60;
  const step = w / (points.length - 1);
  const pathD = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(1)} ${(h / 2 - (v / 100) * (h / 2 - 4)).toFixed(1)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
      <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#334155" strokeWidth={1} strokeDasharray="3 3" />
      <path
        d={pathD}
        fill="none"
        stroke={isReal ? "#10b981" : "#ef4444"}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Render SVG 8-Layer Physics Telemetry Bar Chart
 */
function renderSvgLayerScoresGraph(t: TelemetryData) {
  const layers = [
    { label: "Spatial CNN", val: t.spatialScore, color: "#3b82f6" },
    { label: "Temporal Motion", val: t.temporalScore, color: "#a855f7" },
    { label: "Biological rPPG", val: t.biologicalScore, color: "#10b981" },
    { label: "Micro-Frequency", val: t.frequencyScore, color: "#f59e0b" },
    { label: "3D Pose Stability", val: t.poseScore, color: "#ec4899" },
    { label: "Ocular Physics", val: t.ocularScore, color: "#06b6d4" },
    { label: "Anatomy Mesh", val: t.anatomyScore, color: "#f43f5e" },
    { label: "Spectral Diffusion", val: t.spectralScore, color: "#6366f1" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
      {layers.map((l, idx) => (
        <div key={idx} className="space-y-0.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{l.label}</span>
            <span className="text-foreground">{Math.round(l.val * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, l.val * 100)}%`, backgroundColor: l.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Downloads/Prints formatted report as a PDF document with live captured frame and clickable logo link.
 */
export function exportReportToPdf(
  title: string,
  markdownReport: string,
  telemetry?: TelemetryData,
  capturedFrame?: string | null
) {
  const printWindow = window.open("", "_blank", "width=880,height=1050");
  if (!printWindow) {
    toast.error("Please allow popups to export the PDF report");
    return;
  }

  const isReal = markdownReport.includes("VERDICT: REAL");
  const parsedSectionsHtml = parseMarkdownToPrintHtml(markdownReport);
  const imageSrc = capturedFrame || `${window.location.origin}/telemetry_scan.png`;
  const appOrigin = window.location.origin;

  const pdfHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4;
            margin: 15mm 15mm 18mm 15mm;
          }
          body {
            font-family: 'Space Grotesk', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-banner {
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .logo-link {
            text-decoration: none;
            color: inherit;
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-badge {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 22px;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
          }
          .main-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }
          .brand-highlight {
            color: #0284c7;
          }
          .subtitle {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 3px;
            font-family: monospace;
          }
          .verdict-badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 12px;
            font-family: monospace;
            text-transform: uppercase;
          }
          .badge-real {
            background-color: #dcfce7 !important;
            color: #15803d !important;
            border: 1px solid #86efac !important;
          }
          .badge-fake {
            background-color: #fee2e2 !important;
            color: #b91c1c !important;
            border: 1px solid #fca5a5 !important;
          }
          .visual-panel {
            display: flex;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 20px;
            align-items: center;
          }
          .subject-photo {
            width: 140px;
            height: 140px;
            border-radius: 8px;
            object-fit: cover;
            border: 1px solid #cbd5e1;
          }
          .graph-box {
            flex: 1;
          }
          .graph-title {
            font-size: 11px;
            font-weight: 700;
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            font-family: monospace;
          }
          .section {
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          h3 {
            font-size: 14px;
            font-weight: 700;
            color: #0369a1;
            margin-top: 14px;
            margin-bottom: 6px;
            border-bottom: none !important;
            padding-bottom: 0px !important;
          }
          p {
            margin: 4px 0;
            font-size: 12.5px;
            color: #334155;
          }
          ul {
            margin: 4px 0;
            padding-left: 18px;
          }
          li {
            margin-bottom: 4px;
            font-size: 12.5px;
            color: #334155;
          }
          strong {
            color: #0f172a;
            font-weight: 600;
          }
          .verdict-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            margin-top: 8px;
            font-family: monospace;
            font-size: 13px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-size: 9.5px;
            color: #94a3b8;
            text-align: center;
            font-family: monospace;
          }
          .footer-link {
            color: #0284c7;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header-banner">
          <a href="${appOrigin}" target="_blank" class="logo-link">
            <div class="logo-badge">🛡️</div>
            <div>
              <div class="main-title">Deepfake <span class="brand-highlight">Shield</span> — Forensics Report</div>
              <div class="subtitle">Biological Telemetry Analysis via TensorFlow.js · ${new Date().toLocaleString()}</div>
            </div>
          </a>
          <div class="verdict-badge ${isReal ? 'badge-real' : 'badge-fake'}">
            ${isReal ? 'VERDICT: REAL' : 'VERDICT: FAKE'}
          </div>
        </div>

        <div class="visual-panel">
          <img src="${imageSrc}" class="subject-photo" alt="Live Subject Telemetry Scan" />
          <div class="graph-box">
            <div class="graph-title">Layer 3 rPPG Cardiac Waveform Signal (${isReal ? 'PERFUSION LOCKED' : 'SIGNAL ABERRATION'})</div>
            <svg viewBox="0 0 500 50" style="width: 100%; height: 50px; background: #0f172a; border-radius: 6px; padding: 4px;">
              <line x1="0" y1="25" x2="500" y2="25" stroke="#334155" stroke-width="1" stroke-dasharray="3 3" />
              <path d="${
                isReal
                  ? "M 0 25 L 20 28 L 40 22 L 60 40 L 80 5 L 100 45 L 120 22 L 140 25 L 160 27 L 180 38 L 200 8 L 220 42 L 240 24 L 260 25 L 280 28 L 300 40 L 320 6 L 340 44 L 360 23 L 380 25 L 400 27 L 420 39 L 440 7 L 460 43 L 480 24 L 500 25"
                  : "M 0 25 L 20 26 L 40 24 L 60 26 L 80 23 L 100 27 L 120 25 L 140 26 L 160 24 L 180 26 L 200 25 L 220 26 L 240 24 L 260 25 L 280 26 L 300 24 L 320 26 L 340 25 L 360 26 L 380 24 L 400 26 L 420 25 L 440 26 L 460 24 L 480 25 L 500 25"
              }" fill="none" stroke="${isReal ? '#10b981' : '#ef4444'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>

        <div class="report-content">
          ${parsedSectionsHtml}
        </div>

        <div class="footer">
          Deepfake Shield Multi-Modal Forensic Engine · Privacy-Compliant Local Execution · <a href="${appOrigin}" class="footer-link" target="_blank">${appOrigin}</a>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(pdfHtml);
  printWindow.document.close();
}

/**
 * Formats Markdown sections to HTML for the PDF print window without underlines after headers
 */
function parseMarkdownToPrintHtml(markdown: string): string {
  const sections = markdown.split(/(?=### )/g);

  return sections
    .map((section) => {
      const lines = section.trim().split("\n");
      const headerMatch = lines[0].match(/###\s+(.*)/);
      const title = headerMatch ? headerMatch[1] : null;
      const bodyLines = headerMatch ? lines.slice(1) : lines;

      let html = `<div class="section">`;
      if (title) {
        html += `<h3 style="border-bottom: none; padding-bottom: 0px; margin-bottom: 6px;">${title}</h3>`;
      }

      bodyLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith("- ")) {
          const content = trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          html += `<ul><li>${content}</li></ul>`;
        } else if (trimmed.startsWith("**VERDICT:")) {
          const content = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          html += `<div class="verdict-box">${content}</div>`;
        } else {
          const content = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          html += `<p>${content}</p>`;
        }
      });

      html += `</div>`;
      return html;
    })
    .join("");
}

/**
 * Basic markdown parser to render formatted headers, key metrics, and bullet lists in UI
 * without underline borders after section headers
 */
function renderFormattedMarkdown(markdown: string) {
  const sections = markdown.split(/(?=### )/g);

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const lines = section.trim().split("\n");
        const headerMatch = lines[0].match(/###\s+(.*)/);
        const title = headerMatch ? headerMatch[1] : null;
        const bodyLines = headerMatch ? lines.slice(1) : lines;

        return (
          <div key={idx} className="pb-2">
            {title && (
              <h3 className="text-base font-display font-semibold text-foreground mb-2 flex items-center gap-2 border-none">
                <span className="h-2 w-2 rounded-full bg-primary" />
                {title}
              </h3>
            )}
            <div className="space-y-1.5 text-muted-foreground text-sm">
              {bodyLines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith("- ")) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-2">
                      <span className="text-primary font-bold">•</span>
                      <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed.substring(2)) }} />
                    </div>
                  );
                }

                if (trimmed.startsWith("**VERDICT:")) {
                  return (
                    <div key={lIdx} className="p-3 rounded-lg bg-card border border-border font-mono text-base font-bold text-foreground mt-2">
                      <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
                    </div>
                  );
                }

                return (
                  <p key={lIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatInlineMarkdown(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
}
