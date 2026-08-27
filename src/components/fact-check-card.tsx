import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, FileSearch } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

export interface FactCheckCardProps {
  href: string;
  statement: string;
  influencer: string;
  stock: string;
  statusLabel: string;
  statusTone: StatusTone;
  summary: string;
  sourceName: string;
  checkedDate: string;
  compact?: boolean;
  variant?: "default" | "home";
}

export function FactCheckCard({
  href,
  statement,
  influencer,
  stock,
  statusLabel,
  statusTone,
  summary,
  sourceName,
  checkedDate,
  compact = false,
  variant = "default",
}: FactCheckCardProps) {
  const isHomeSummary = variant === "home";

  return (
    <article className="surface-card group flex h-full flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#b9cbd2] hover:shadow-[0_15px_40px_rgb(19_43_58/7%)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        {isHomeSummary ? (
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
            <Building2 aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
            <span className="truncate font-extrabold">{stock}</span>
          </div>
        ) : (
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
        )}
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-slate-400">
          <CalendarDays aria-hidden="true" className="size-3.5" />
          {checkedDate}
        </span>
      </div>

      <blockquote className={`mt-4 font-extrabold tracking-[-0.02em] text-ink ${compact || isHomeSummary ? "line-clamp-2 text-[15px] leading-6" : "text-base leading-7"}`}>
        “{statement}”
      </blockquote>
      {!isHomeSummary && <p className="mt-2 text-xs font-semibold text-muted">{influencer}</p>}

      {isHomeSummary ? (
        <div className="mt-4">
          <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-600">
          <Building2 aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
          <span className="truncate font-bold">{stock}</span>
        </div>
      )}

      {!compact && !isHomeSummary && <p className="mt-4 text-sm leading-6 text-slate-600">{summary}</p>}

      <div className={`mt-auto pt-5 ${isHomeSummary ? "border-t border-line" : ""}`}>
        {!isHomeSummary && (
          <div className="flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
            <FileSearch aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">근거 · {sourceName}</span>
          </div>
        )}
        <Link
          href={href}
          aria-label={`${statement} 팩트체크 상세 보기`}
          className={`${isHomeSummary ? "" : "mt-4"} flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-4 text-sm font-extrabold text-ink transition group-hover:bg-[#eaf3f3] group-hover:text-brand`}
        >
          {isHomeSummary ? "상세 보기" : "상세 근거 보기"}
          <ArrowUpRight aria-hidden="true" className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
