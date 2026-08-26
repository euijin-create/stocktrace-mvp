import { CircleGauge, Info } from "lucide-react";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceMeterProps {
  score: number;
  level?: ConfidenceLevel;
  rationale?: string;
  label?: string;
  className?: string;
  showGuide?: boolean;
}

const LEVEL_META: Record<
  ConfidenceLevel,
  { label: string; bar: string; badge: string }
> = {
  high: {
    label: "높음",
    bar: "bg-emerald-600",
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
  medium: {
    label: "보통",
    bar: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  low: {
    label: "낮음",
    bar: "bg-slate-500",
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
  },
};

function inferLevel(score: number): ConfidenceLevel {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

export function ConfidenceMeter({
  score,
  level,
  rationale,
  label = "AI 분석 신뢰수준",
  className = "",
  showGuide = true,
}: ConfidenceMeterProps) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const resolvedLevel = level ?? inferLevel(normalizedScore);
  const meta = LEVEL_META[resolvedLevel];

  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 ${className}`}
      aria-label={label}
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
          <CircleGauge aria-hidden="true" className="size-4 shrink-0 text-brand" />
          <span className="truncate">{label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badge}`}
          >
            {meta.label}
          </span>
          <strong className="number-tabular text-sm text-slate-900">
            {normalizedScore}%
          </strong>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label={`${label} ${meta.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedScore}
        aria-valuetext={`${normalizedScore}퍼센트, ${meta.label}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${meta.bar}`}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>

      {rationale ? (
        <p className="mt-3 break-words text-sm leading-6 text-slate-600">
          {rationale}
        </p>
      ) : null}

      {showGuide ? (
        <p className="mt-3 flex gap-2 text-xs leading-5 text-slate-500">
          <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            입력된 문맥을 기준으로 한 AI 분석의 확신도이며, 사실의
            확정 정도를 뜻하지 않습니다.
          </span>
        </p>
      ) : null}
    </section>
  );
}

