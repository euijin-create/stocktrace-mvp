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
      className={`flex gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/80 text-blue-950 ${
        compact ? "px-3.5 py-3" : "p-4 sm:p-5"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
      >
        <FlaskConical className="size-4.5" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-[-0.015em]">{title}</p>
        <div className={`${compact ? "mt-0.5 text-xs" : "mt-1 text-sm"} leading-6 text-blue-900/80`}>
          {children ?? description ?? fullDescription}
        </div>
      </div>
    </aside>
  );
}

