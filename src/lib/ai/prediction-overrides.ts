import type { ContentAnalysisInput } from "@/lib/mock-analysis";
import type {
  MissingPredictionCondition,
  Money,
  PredictionDirection,
  PredictionStatus,
} from "@/types/stocktrace";

export interface PredictionAnalysisOverrides {
  stockLabel: string | null;
  direction: PredictionDirection | undefined;
  targetReturnPct: number | undefined;
  targetPrice: Money | undefined;
  horizonLabel: string | undefined;
  missingConditions: MissingPredictionCondition[];
  status: PredictionStatus;
  evaluationMissingReason: string | null;
}

export function getPredictionAnalysisOverrides(
  input: ContentAnalysisInput | null | undefined,
): PredictionAnalysisOverrides | null {
  const statement = input?.structuredAnalysis;
  if (!statement || statement.statementType !== "prediction") return null;

  const direction =
    statement.direction === "up" || statement.direction === "down"
      ? statement.direction
      : undefined;
  const targetReturnPct = statement.targetReturnPercent ?? undefined;
  const targetPrice =
    statement.targetPrice === null
      ? undefined
      : { amount: statement.targetPrice, currency: "KRW" as const };
  const horizonLabel = statement.predictionPeriod ?? undefined;
  const missingConditions: MissingPredictionCondition[] = [];
  if (!direction) missingConditions.push("direction");
  if (targetReturnPct === undefined && targetPrice === undefined) missingConditions.push("target");
  if (!horizonLabel) missingConditions.push("period");

  return {
    stockLabel: statement.stockName ?? statement.company,
    direction,
    targetReturnPct,
    targetPrice,
    horizonLabel,
    missingConditions,
    status: statement.evaluationPossible ? "tracking" : "insufficient_conditions",
    evaluationMissingReason: statement.evaluationMissingReason,
  };
}
