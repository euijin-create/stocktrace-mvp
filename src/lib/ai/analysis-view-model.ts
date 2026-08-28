import type {
  AnalysisMode,
  StockAnalysisResponse,
  StockStatementAnalysis,
} from "@/lib/ai/types";
import { CLAIM_TYPE, type ClaimType } from "@/types/stocktrace";

export type AnalysisViewKind =
  | "fact"
  | "prediction"
  | "opinion"
  | "insufficient_prediction"
  | "context_risk"
  | "conflict";

export interface AnalysisViewResult {
  kind: AnalysisViewKind;
  claimType: ClaimType;
  label: string;
  description: string;
  conditionLabel: string;
  detectedEntity: string;
  confidence?: number;
  destinationHref: string | null;
  destinationLabel: string | null;
  receiptHref: string | null;
  structuredAnalysis: StockStatementAnalysis;
  predictionDetails?: {
    directionLabel: "상승" | "하락" | "중립" | "방향 확인 필요";
    targetReturnLabel?: string;
    targetPriceLabel?: string;
    periodLabel?: string;
  };
}

export interface AnalyzedStatementView {
  id: string;
  statement: string;
  analysis: AnalysisViewResult;
}

function formatPercent(value: number | null): string | undefined {
  if (value === null) return undefined;
  return `${value > 0 ? "+" : ""}${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%`;
}

function formatPrice(value: number | null): string | undefined {
  if (value === null) return undefined;
  return `${value.toLocaleString("ko-KR")}원`;
}

function getDirectionLabel(direction: StockStatementAnalysis["direction"]) {
  if (direction === "up") return "상승" as const;
  if (direction === "down") return "하락" as const;
  if (direction === "neutral") return "중립" as const;
  return "방향 확인 필요" as const;
}

function getBaseView(statement: StockStatementAnalysis, mode: AnalysisMode): AnalysisViewResult {
  const confidence = mode === "demo" ? 90 : undefined;
  const detectedEntity = statement.stockName ?? statement.company ?? "종목 확인 필요";

  switch (statement.statementType) {
    case "fact_claim":
      return {
        kind: "fact",
        claimType: CLAIM_TYPE.VERIFIABLE_FACT,
        label: "공식자료로 확인 가능한 사실 주장",
        description: `${statement.summary}. 실제 사실 여부는 아직 판단하지 않았으며 공식자료 확인이 필요합니다.`,
        conditionLabel: "팩트체크 대상",
        detectedEntity,
        confidence,
        destinationHref: "/fact-checks/fact-contract-confirmed",
        destinationLabel: "팩트체크 결과 보기",
        receiptHref: "/receipts/receipt-contract",
        structuredAnalysis: statement,
      };
    case "prediction": {
      const evaluable = statement.evaluationPossible;
      return {
        kind: evaluable ? "prediction" : "insufficient_prediction",
        claimType: CLAIM_TYPE.PRICE_PREDICTION,
        label: "미래 주가 예측",
        description: evaluable
          ? `${statement.summary}. 추출된 조건으로 향후 결과를 추적할 수 있습니다.`
          : `${statement.summary}. ${statement.evaluationMissingReason ?? "객관적인 평가 조건을 추가로 확인해야 합니다."}`,
        conditionLabel: evaluable ? "평가조건 충족" : "평가조건 불충분",
        detectedEntity,
        confidence,
        destinationHref: evaluable
          ? "/predictions?focus=prediction-tracking"
          : "/predictions?focus=prediction-insufficient",
        destinationLabel: evaluable ? "예측 추적 보기" : "조건 불충분 예측 보기",
        receiptHref: evaluable
          ? "/receipts/receipt-prediction-completed"
          : "/receipts/receipt-prediction-insufficient",
        structuredAnalysis: statement,
        predictionDetails: {
          directionLabel: getDirectionLabel(statement.direction),
          targetReturnLabel: formatPercent(statement.targetReturnPercent),
          targetPriceLabel: formatPrice(statement.targetPrice),
          periodLabel: statement.predictionPeriod ?? undefined,
        },
      };
    }
    case "opinion":
      return {
        kind: "opinion",
        claimType: CLAIM_TYPE.OPINION,
        label: "개인적인 의견",
        description: "개인적인 의견으로 분류되었습니다. 공식자료를 이용한 사실 검증 대상은 아닙니다.",
        conditionLabel: "팩트체크·예측 평가 대상 아님",
        detectedEntity,
        confidence,
        destinationHref: null,
        destinationLabel: null,
        receiptHref: null,
        structuredAnalysis: statement,
      };
    case "exaggeration_or_context_missing":
      return {
        kind: "context_risk",
        claimType: CLAIM_TYPE.CONTEXT_RISK,
        label: "과장 또는 맥락 누락 가능 표현",
        description: `${statement.summary}. 핵심 조건과 전후 맥락을 추가로 확인해 주세요.`,
        conditionLabel: "추가 맥락 확인 필요",
        detectedEntity,
        confidence,
        destinationHref: null,
        destinationLabel: null,
        receiptHref: null,
        structuredAnalysis: statement,
      };
    case "advertising_or_conflict":
      return {
        kind: "conflict",
        claimType: CLAIM_TYPE.CONFLICT_DISCLOSURE,
        label: "광고 또는 이해관계 관련 표현",
        description: `${statement.summary}. 관련 표현의 존재만 표시하며 실제 이해관계가 존재한다고 단정하지 않습니다.`,
        conditionLabel: "공개 표현 객관적 기록",
        detectedEntity,
        confidence,
        destinationHref: null,
        destinationLabel: null,
        receiptHref: null,
        structuredAnalysis: statement,
      };
  }
}

export function toAnalysisViewModel(response: StockAnalysisResponse): AnalyzedStatementView[] {
  return response.statements.map((statement, index) => ({
    id: `extracted-statement-${index + 1}`,
    statement: statement.originalStatement,
    analysis: getBaseView(statement, response.mode),
  }));
}
