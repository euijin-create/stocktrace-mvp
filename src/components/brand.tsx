import Link from "next/link";
import { ScanLine, TrendingUp } from "lucide-react";

type BrandProps = {
  className?: string;
  compact?: boolean;
  href?: string;
};

export function Brand({ className = "", compact = false, href = "/" }: BrandProps) {
  return (
    <Link
      href={href}
      aria-label="StockTrace 홈으로 이동"
      className={`group inline-flex min-h-11 items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 ${className}`}
    >
      <span
        aria-hidden="true"
        className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand text-white shadow-sm"
      >
        <ScanLine className="size-6 opacity-90" strokeWidth={1.8} />
        <span className="absolute bottom-1 right-1 grid size-4 place-items-center rounded-md bg-mint text-white ring-2 ring-brand">
          <TrendingUp className="size-3" strokeWidth={2.6} />
        </span>
      </span>

      <span className="min-w-0">
        <span className="block text-[1.08rem] font-extrabold leading-none tracking-[-0.035em] text-slate-950">
          Stock<span className="text-action">Trace</span>
        </span>
        {!compact ? (
          <span className="mt-1 block whitespace-nowrap text-[0.68rem] font-medium leading-none tracking-[-0.01em] text-slate-500">
            주식 발언 검증 · 예측 추적
          </span>
        ) : null}
      </span>
    </Link>
  );
}
