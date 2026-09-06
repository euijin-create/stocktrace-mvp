import { FlaskConical } from "lucide-react";
import type { ReactNode } from "react";

type DemoNoticeProps = {
  children?: ReactNode;
  className?: string;
  compact?: boolean;
  description?: ReactNode;
  title?: string;
};

const fullDescription = (
  <>
    이 안내가 표시된 영역은 화면 흐름을 위한 예시 데이터를 포함합니다. 실제 데이터가 사용된 결과는
    출처 배지로 구분합니다. StockTrace는 종목의 매수·매도를 추천하거나 위법 여부를 판단하지 않습니다.
  </>
);

export function DemoNotice({
  children,
  className = "",
  compact = false,
  description,
  title = "데모 데이터 안내",
}: DemoNoticeProps) {
  return (
    <aside
      aria-label={title}
      className={`flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-700 ${
        compact ? "px-3.5 py-2.5" : "p-4"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200"
      >
        <FlaskConical className="size-4" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold tracking-[-0.01em] text-slate-600">{title}</p>
        <div className={`${compact ? "mt-0.5 text-[11px]" : "mt-1 text-xs"} leading-5 text-slate-500`}>
          {children ?? description ?? fullDescription}
        </div>
      </div>
    </aside>
  );
}
