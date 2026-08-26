import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Info,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

type StatusBadgeProps = {
  children?: ReactNode;
  className?: string;
  icon?: LucideIcon;
  label?: ReactNode;
  showIcon?: boolean;
  tone?: StatusTone;
};

const toneStyles: Record<StatusTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
};

const toneIcons: Record<StatusTone, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  info: Info,
  neutral: CircleHelp,
};

export function StatusBadge({
  children,
  className = "",
  icon,
  label,
  showIcon = true,
  tone = "neutral",
}: StatusBadgeProps) {
  const Icon = icon ?? toneIcons[tone];
  const content = children ?? label;

  return (
    <span
      className={`inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-4 ${toneStyles[tone]} ${className}`}
    >
      {showIcon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} /> : null}
      <span className="truncate">{content}</span>
    </span>
  );
}

