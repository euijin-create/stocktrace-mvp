import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Info,
  MessageSquareText,
  ScanSearch,
} from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import type { AnalysisMode, StockStatementType } from "@/lib/ai/types";

type StatementTypePresentation = {
  description: string;
  icon: LucideIcon;
  label: string;
  tone: StatusTone;
};

const STATEMENT_TYPE_PRESENTATION: Record<StockStatementType, StatementTypePresentation> = {
  fact_claim: {
    label: "사실 주장",
    description: "공식자료를 통해 사실 여부를 확인할 수 있는 발언입니다.",
    icon: ScanSearch,
    tone: "info",
  },
  prediction: {
    label: "미래 예측",
    description: "미래 주가의 방향이나 수익률을 예상한 발언입니다.",
    icon: BarChart3,
    tone: "info",
  },
  opinion: {
    label: "개인 의견",
    description: "정보 제공자의 주관적인 판단이 포함된 발언입니다.",
    icon: MessageSquareText,
    tone: "neutral",
  },
  exaggeration_or_context_missing: {
    label: "과장·맥락 확인 필요",
    description: "단정적 표현이나 추가 맥락 확인이 필요한 발언입니다.",
    icon: AlertTriangle,
    tone: "warning",
  },
  advertising_or_conflict: {
    label: "광고·이해관계 관련 표현",
    description: "광고 또는 이해관계 공개와 관련된 표현이 포함되어 있습니다.",
    icon: Info,
    tone: "warning",
  },
};

type AiStatementClassificationProps = {
  className?: string;
  compact?: boolean;
  mode?: AnalysisMode;
  statementType: StockStatementType;
};

export function AiStatementClassification({
  className = "",
  compact = false,
  mode = "ai",
  statementType,
}: AiStatementClassificationProps) {
  const presentation = STATEMENT_TYPE_PRESENTATION[statementType];
  const sourceLabel = mode === "ai" ? "AI 발언 분류" : "데모 발언 분류";

  return (
    <div
      aria-label={`${sourceLabel}: ${presentation.label}`}
      className={`rounded-xl border border-blue-100 bg-blue-50/55 ${compact ? "px-3.5 py-3" : "px-4 py-3.5"} ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[11px] font-extrabold tracking-[0.08em] text-slate-600">
          {sourceLabel}
        </span>
        <StatusBadge
          icon={presentation.icon}
          tone={presentation.tone}
          className="min-h-7 px-2.5"
        >
          {presentation.label}
        </StatusBadge>
      </div>
      <p className={`${compact ? "mt-2 text-xs leading-5" : "mt-2.5 text-sm leading-6"} text-slate-700`}>
        {presentation.description}
      </p>
      {statementType === "fact_claim" ? (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold leading-5 text-blue-900">
          <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            ‘사실 주장’은 사실로 확인됐다는 뜻이 아니라, 공식자료로 검증할 수 있는 유형이라는 의미입니다.
          </span>
        </p>
      ) : null}
    </div>
  );
}
