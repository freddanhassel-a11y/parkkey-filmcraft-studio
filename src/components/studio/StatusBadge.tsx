import { CheckCircle2, CircleDashed, CircleSlash, Clock, FileText, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP: Record<string, { icon: typeof CheckCircle2; tone: string; help: string }> = {
  DRAFT: {
    icon: CircleDashed,
    tone: "text-status-neutral border-status-neutral/40",
    help: "Utkast",
  },
  "PROMPT READY": {
    icon: FileText,
    tone: "text-status-unknown border-status-unknown/40",
    help: "Prompt klar",
  },
  RENDERING: {
    icon: Clock,
    tone: "text-status-warning border-status-warning/50",
    help: "Renderar",
  },
  "READY FOR QA": {
    icon: CircleSlash,
    tone: "text-status-warning border-status-warning/50",
    help: "Klar för QA",
  },
  APPROVED: {
    icon: CheckCircle2,
    tone: "text-status-verified border-status-verified/50",
    help: "Godkänd",
  },
  EXPORTED: {
    icon: Upload,
    tone: "text-status-verified border-status-verified/60",
    help: "Exporterad",
  },
  "NO FILE": {
    icon: CircleSlash,
    tone: "text-status-neutral border-status-neutral/40",
    help: "Ingen fil",
  },
  QUEUED: { icon: Clock, tone: "text-status-unknown border-status-unknown/40", help: "I kö" },
  READY: {
    icon: CheckCircle2,
    tone: "text-status-verified border-status-verified/50",
    help: "Fil finns",
  },
  FAILED: {
    icon: CircleSlash,
    tone: "text-status-error border-status-error/50",
    help: "Misslyckad",
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const conf = MAP[status] ?? {
    icon: CircleDashed,
    tone: "text-status-neutral border-status-neutral/40",
    help: status,
  };
  const Icon = conf.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
        conf.tone,
        className,
      )}
      title={conf.help}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {status}
    </span>
  );
}

export function TruthBadge({ label }: { label: string }) {
  const verified = label === "VERIFIED" || label === "LIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
        verified
          ? "border-status-verified/50 text-status-verified"
          : "border-status-unknown/40 text-status-unknown",
      )}
    >
      {label}
    </span>
  );
}
