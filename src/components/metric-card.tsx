import type { LucideIcon } from "lucide-react";

type MetricTone = "brand" | "blue" | "emerald" | "amber" | "slate";

const tones: Record<MetricTone, { icon: string; bar: string }> = {
  brand: { icon: "bg-[#e7f1f2] text-brand", bar: "bg-brand" },
  blue: { icon: "bg-blue-50 text-blue-700", bar: "bg-blue-600" },
  emerald: { icon: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-600" },
  amber: { icon: "bg-amber-50 text-amber-800", bar: "bg-amber-500" },
  slate: { icon: "bg-slate-100 text-slate-600", bar: "bg-slate-500" },
};

export interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  progress?: number;
  tone?: MetricTone;
}

export function MetricCard({ icon: Icon, label, value, detail, progress, tone = "brand" }: MetricCardProps) {
  const safeProgress = progress === undefined ? undefined : Math.max(0, Math.min(100, progress));
  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tones[tone].icon}`}>
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <span className="number-tabular text-xl font-black tracking-[-0.03em] text-ink">{value}</span>
      </div>
      <h3 className="mt-4 text-sm font-extrabold text-ink">{label}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
      {safeProgress !== undefined && (
        <div className="mt-4" aria-label={`${label} ${safeProgress}%`}>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${tones[tone].bar}`} style={{ width: `${safeProgress}%` }} />
          </div>
        </div>
      )}
    </article>
  );
}
