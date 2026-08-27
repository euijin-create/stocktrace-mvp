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
    현재 표시되는 분석, 공시, 주가와 성과는 화면 흐름을 보여주기 위한 예시입니다.
    실제 투자 판단에 사용할 수 없으며, StockTrace는 종목의 매수·매도를 추천하거나
    인플루언서의 위법 여부를 판정하지 않습니다.
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
