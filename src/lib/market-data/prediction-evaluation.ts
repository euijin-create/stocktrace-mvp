import {
  compareDateStrings,
  isCompletedDailyDate,
} from "./date";
import type {
  DailyPriceBar,
  KoreanMarket,
  PredictionActualAssessment,
  PredictionCompletedAssessment,
  PredictionDirection,
  PredictionEvaluationUnavailableReason,
  PredictionTargetSnapshot,
} from "./types";

interface EvaluatePredictionInput {
  benchmarkBars: DailyPriceBar[];
  benchmarkName: KoreanMarket;
  direction: PredictionDirection;
  dueDate: string | null;
  now?: Date;
  statementDate: string;
  stockBars: DailyPriceBar[];
  targets: PredictionTargetSnapshot;
}

function unavailable(
  dueDate: string | null,
  reason: PredictionEvaluationUnavailableReason,
  message: string,
): PredictionActualAssessment {
  return { dueDate, message, reason, status: "unavailable" };
}

function uniqueSortedBars(bars: DailyPriceBar[]): DailyPriceBar[] {
  const byDate = new Map<string, DailyPriceBar>();
  for (const bar of bars) byDate.set(bar.date, bar);
  return [...byDate.values()].sort((left, right) =>
    compareDateStrings(left.date, right.date),
  );
}

function latestBarOnOrBefore(
  bars: DailyPriceBar[],
  date: string,
): DailyPriceBar | null {
  for (let index = bars.length - 1; index >= 0; index -= 1) {
    if (compareDateStrings(bars[index].date, date) <= 0) return bars[index];
  }
  return null;
}

function calculateReturn(start: number, end: number): number {
  return ((end - start) / start) * 100;
}

function calendarDayDistance(start: string, end: string): number {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endTime - startTime) / 86_400_000);
}

function calculateMaximumDrawdown(bars: DailyPriceBar[]): number {
  let peak = bars[0].close;
  let maximumDrawdown = 0;
  for (const bar of bars) {
    peak = Math.max(peak, bar.close);
    maximumDrawdown = Math.min(
      maximumDrawdown,
      ((bar.close - peak) / peak) * 100,
    );
  }
  return maximumDrawdown;
}

function finalAssessmentText(
  finalResult: PredictionCompletedAssessment["finalResult"],
  direction: "down" | "up",
  actualReturnPct: number,
): string {
  const returnLabel = `${actualReturnPct > 0 ? "+" : ""}${actualReturnPct.toLocaleString(
    "ko-KR",
    { maximumFractionDigits: 2 },
  )}%`;
  if (finalResult === "target_achieved") {
    return `평가기간 중 목표가격에 도달했습니다. 평가 종료일 기준 실제 수익률은 ${returnLabel}입니다.`;
  }
  if (finalResult === "direction_only_correct") {
    return `목표가격에는 도달하지 못했지만, 평가 종료일 기준 ${direction === "up" ? "상승" : "하락"} 방향은 맞았습니다.`;
  }
  return `평가기간 중 목표가격에 도달하지 못했고, 평가 종료일 기준 ${direction === "up" ? "상승" : "하락"} 방향도 맞지 않았습니다.`;
}

export function evaluatePredictionFromDailyBars({
  benchmarkBars,
  benchmarkName,
  direction,
  dueDate,
  now = new Date(),
  statementDate,
  stockBars,
  targets,
}: EvaluatePredictionInput): PredictionActualAssessment {
  if (!dueDate) {
    return unavailable(
      null,
      "conditions_insufficient",
      "구체적인 예측 기간이 없어 현재 평가할 수 없습니다.",
    );
  }
  if (direction !== "up" && direction !== "down") {
    return unavailable(
      dueDate,
      "conditions_insufficient",
      "상승 또는 하락 방향이 명확하지 않아 현재 평가할 수 없습니다.",
    );
  }

  const targetPrice =
    targets.statedTargetPrice ?? targets.calculatedTargetPrice;
  const targetSource =
    targets.statedTargetPrice !== null ? "stated" : "calculated";
  if (targetPrice === null) {
    return unavailable(
      dueDate,
      "conditions_insufficient",
      "목표가격 또는 목표수익률이 없어 현재 평가할 수 없습니다.",
    );
  }

  const normalizedStockBars = uniqueSortedBars(stockBars);
  const priceAtStatement = latestBarOnOrBefore(
    normalizedStockBars,
    statementDate,
  );
  if (!priceAtStatement) {
    return unavailable(
      dueDate,
      "stock_data_missing",
      "발언일 기준 실제 주가를 찾지 못해 현재 평가할 수 없습니다.",
    );
  }
  if (
    (direction === "up" && targetPrice <= priceAtStatement.close) ||
    (direction === "down" && targetPrice >= priceAtStatement.close)
  ) {
    return unavailable(
      dueDate,
      "invalid_target",
      "예측 방향과 목표가격의 관계를 객관적인 평가 기준으로 만들 수 없습니다.",
    );
  }
  if (!isCompletedDailyDate(dueDate, now)) {
    return { dueDate, status: "tracking" };
  }

  const evaluationPrice = latestBarOnOrBefore(normalizedStockBars, dueDate);
  if (!evaluationPrice) {
    return unavailable(
      dueDate,
      "stock_data_missing",
      "평가일 기준 실제 주가를 찾지 못해 현재 평가할 수 없습니다.",
    );
  }
  const evaluationBars = normalizedStockBars.filter(
    (bar) =>
      compareDateStrings(bar.date, priceAtStatement.date) >= 0 &&
      compareDateStrings(bar.date, evaluationPrice.date) <= 0,
  );
  if (evaluationBars.length === 0) {
    return unavailable(
      dueDate,
      "period_data_invalid",
      "평가기간의 실제 주가 데이터가 충분하지 않습니다.",
    );
  }
  const evaluationLagDays = calendarDayDistance(
    evaluationPrice.date,
    dueDate,
  );
  const evaluationPeriodDays = calendarDayDistance(
    priceAtStatement.date,
    dueDate,
  );
  if (
    evaluationLagDays > 14 ||
    (evaluationPeriodDays >= 7 && evaluationBars.length < 2)
  ) {
    return unavailable(
      dueDate,
      "period_data_invalid",
      "평가일에 가까운 실제 주가 데이터가 충분하지 않아 현재 평가할 수 없습니다.",
    );
  }

  const normalizedBenchmarkBars = uniqueSortedBars(benchmarkBars);
  const benchmarkBasePrice = latestBarOnOrBefore(
    normalizedBenchmarkBars,
    priceAtStatement.date,
  );
  const benchmarkEvaluationPrice = latestBarOnOrBefore(
    normalizedBenchmarkBars,
    evaluationPrice.date,
  );
  if (
    !benchmarkBasePrice ||
    !benchmarkEvaluationPrice ||
    compareDateStrings(
      benchmarkEvaluationPrice.date,
      benchmarkBasePrice.date,
    ) < 0
  ) {
    return unavailable(
      dueDate,
      "benchmark_data_missing",
      `${benchmarkName} 기준지수 데이터를 충분히 찾지 못해 현재 평가할 수 없습니다.`,
    );
  }

  const actualReturnPct = calculateReturn(
    priceAtStatement.close,
    evaluationPrice.close,
  );
  const benchmarkReturnPct = calculateReturn(
    benchmarkBasePrice.close,
    benchmarkEvaluationPrice.close,
  );
  const periodHighPrice = Math.max(...evaluationBars.map((bar) => bar.high));
  const periodLowPrice = Math.min(...evaluationBars.map((bar) => bar.low));
  const targetReached =
    direction === "up"
      ? periodHighPrice >= targetPrice
      : periodLowPrice <= targetPrice;
  const directionMatched =
    direction === "up" ? actualReturnPct > 0 : actualReturnPct < 0;
  const finalResult = targetReached
    ? "target_achieved"
    : directionMatched
      ? "direction_only_correct"
      : "target_not_achieved";

  return {
    actualReturnPct,
    benchmarkBasePrice,
    benchmarkEvaluationPrice,
    benchmarkReturnPct,
    barsEvaluated: evaluationBars.length,
    dataMode: "actual",
    directionMatched,
    dueDate,
    evaluationPrice,
    excessReturnPct: actualReturnPct - benchmarkReturnPct,
    finalAssessment: finalAssessmentText(
      finalResult,
      direction,
      actualReturnPct,
    ),
    finalResult,
    maxDrawdownPct: calculateMaximumDrawdown(evaluationBars),
    methodologyNote:
      "실제 시작 거래일부터 평가 거래일까지의 일별 데이터를 사용했습니다. 목표 도달은 일중 고가·저가, MDD는 일별 종가 기준이며 배당·세금·거래비용은 반영하지 않습니다.",
    periodHighPrice,
    periodLowPrice,
    priceAtStatement,
    status: "completed",
    targetPrice,
    targetReached,
    targetSource,
  };
}
