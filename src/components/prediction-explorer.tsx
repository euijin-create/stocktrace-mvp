"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Layers3,
} from "lucide-react";
import { AnalysisInputSummary } from "@/components/analysis-input-summary";
import {
  PredictionCard,
  type PredictionEvaluation as PredictionCardEvaluation,
} from "@/components/prediction-card";
import { PredictionMarketData } from "@/components/prediction-market-data";
import { mockDatabase } from "@/data/mock-data";
import { getPredictionAnalysisOverrides } from "@/lib/ai/prediction-overrides";
import { appendAnalysisInput, readAnalysisInput } from "@/lib/mock-analysis";
import { formatKoreanDate, getPredictionView } from "@/lib/stocktrace";
import type { PredictionMarketSnapshotResult } from "@/lib/market-data/types";
import type { PredictionStatus } from "@/types/stocktrace";

type Filter = "all" | "active" | "completed" | "review" | "insufficient";

const filters: Array<{ id: Filter; label: string; icon: typeof Layers3 }> = [
  { id: "all", label: "전체", icon: Layers3 },
  { id: "active", label: "추적 중", icon: Clock3 },
  { id: "completed", label: "평가 완료", icon: CheckCircle2 },
  { id: "review", label: "데이터 확인 필요", icon: CalendarClock },
  { id: "insufficient", label: "조건 불충분", icon: AlertTriangle },
];

function filterForStatus(status?: PredictionStatus): Filter {
  if (status === "completed") return "completed";
  if (status === "evaluation_due") return "review";
  if (status === "insufficient_conditions") return "insufficient";
  if (status === "tracking") return "active";
  return "all";
}

function resolveEffectiveStatus(
  fallbackStatus: PredictionStatus,
  overrideStatus: PredictionStatus | null,
  marketDataResult: PredictionMarketSnapshotResult | null,
): PredictionStatus {
  if (!overrideStatus) return fallbackStatus;
  if (overrideStatus === "insufficient_conditions") {
    return "insufficient_conditions";
  }
  if (marketDataResult?.assessment.status === "completed") return "completed";
  if (marketDataResult?.assessment.status === "unavailable") {
    return "evaluation_due";
  }
  if (marketDataResult?.assessment.status === "tracking") return "tracking";
  return overrideStatus;
}

function toActualCardEvaluation(
  result: PredictionMarketSnapshotResult | null,
): PredictionCardEvaluation | undefined {
  if (!result?.ok || result.assessment.status !== "completed") return undefined;
  const assessment = result.assessment;
  return {
    actualReturnPct: assessment.actualReturnPct,
    benchmarkName: result.benchmark.name,
    benchmarkReturnPct: assessment.benchmarkReturnPct,
    dataMode: "actual",
    endPrice: {
      amount: assessment.evaluationPrice.close,
      currency: "KRW",
    },
    evaluatedAt: formatKoreanDate(assessment.evaluationPrice.date),
    excessReturnPct: assessment.excessReturnPct,
    finalAssessment: assessment.finalAssessment,
    maxDrawdownPct: assessment.maxDrawdownPct,
    methodologyNote: assessment.methodologyNote,
    observedHighPrice: {
      amount: assessment.periodHighPrice,
      currency: "KRW",
    },
    observedLowPrice: {
      amount: assessment.periodLowPrice,
      currency: "KRW",
    },
    targetReached: assessment.targetReached,
  };
}

export function PredictionExplorer({
  marketDataResult,
}: {
  marketDataResult: PredictionMarketSnapshotResult | null;
}) {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const analysisInput = useMemo(
    () => readAnalysisInput((key) => searchParams.get(key)),
    [searchParams],
  );
  const views = useMemo(
    () => mockDatabase.predictions.map(({ id }) => getPredictionView(id)).filter((view) => view !== undefined),
    [],
  );
  const focusedView = views.find(({ prediction }) => prediction.id === focusId);
  const focusedOverrides = focusedView
    ? getPredictionAnalysisOverrides(analysisInput)
    : null;
  const displayedViews =
    focusedView &&
    analysisInput?.structuredAnalysis?.statementType === "prediction"
      ? [focusedView]
      : views;
  const focusedEffectiveStatus = focusedView
    ? resolveEffectiveStatus(
        focusedView.prediction.status,
        focusedOverrides?.status ?? null,
        marketDataResult,
      )
    : undefined;
  const filterKey = focusId
    ? `${focusId}:${focusedEffectiveStatus ?? "unknown"}`
    : "no-focus";
  const defaultFilter = filterForStatus(focusedEffectiveStatus);
  const [filterSelection, setFilterSelection] = useState<{
    key: string;
    value: Filter;
  }>(() => ({ key: filterKey, value: defaultFilter }));
  const filter =
    filterSelection.key === filterKey ? filterSelection.value : defaultFilter;
  const setFilter = (value: Filter) =>
    setFilterSelection({ key: filterKey, value });

  const statusForPrediction = (id: string, status: PredictionStatus) =>
    id === focusId && focusedEffectiveStatus ? focusedEffectiveStatus : status;

  const filtered = displayedViews.filter(({ prediction }) => {
    const status = statusForPrediction(prediction.id, prediction.status);
    if (filter === "all") return true;
    if (filter === "active") return status === "tracking";
    if (filter === "completed") return status === "completed";
    if (filter === "review") return status === "evaluation_due";
    return status === "insufficient_conditions";
  });

  useEffect(() => {
    if (!focusId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(focusId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusId]);

  return (
    <div>
      {analysisInput && (
        <div className="mb-6">
          <AnalysisInputSummary input={analysisInput} />
          {analysisInput.structuredAnalysis && (
            <p className="mt-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-2.5 text-xs font-semibold leading-5 text-blue-900">
              {analysisInput.analysisMode === "ai" ? "Gemini 실제 AI 분석" : "데모 분석"}에서 추출한 예측 조건을 카드에 반영했습니다. {marketDataResult?.assessment.status === "completed"
                ? "실제 시장데이터로 사후평가를 완료했습니다."
                : marketDataResult?.ok && marketDataResult.assessment.status === "tracking"
                  ? "발언일 종가와 기준지수는 실제 시장데이터이며, 미래 가격은 미리 평가하지 않습니다."
                  : marketDataResult?.assessment.status === "unavailable"
                    ? "평가기간은 끝났지만 실제 평가 데이터를 충분히 확인하지 못했습니다."
                    : "실제 주가 조회 결과는 선택한 카드에서 별도로 안내합니다."}
            </p>
          )}
        </div>
      )}
      <div className="surface-card flex gap-2 overflow-x-auto p-2" role="group" aria-label="예측 상태 필터">
        {filters.map((item) => {
          const active = filter === item.id;
          const Icon = item.icon;
          const count = displayedViews.filter(({ prediction }) => {
            const status = statusForPrediction(prediction.id, prediction.status);
            if (item.id === "all") return true;
            if (item.id === "active") return status === "tracking";
            if (item.id === "completed") return status === "completed";
            if (item.id === "review") return status === "evaluation_due";
            return status === "insufficient_conditions";
          }).length;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(item.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition ${active ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-slate-100 hover:text-ink"}`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {item.label}
              <span className={`number-tabular rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-5">
        {filtered.map(({ prediction, statement, influencer, stock }) => {
          const focused = focusId === prediction.id;
          const overrides = focused ? getPredictionAnalysisOverrides(analysisInput) : null;
          const actualEvaluation = focused
            ? toActualCardEvaluation(marketDataResult)
            : undefined;
          const evaluation: PredictionCardEvaluation | undefined = overrides
            ? actualEvaluation
            : prediction.evaluation
              ? { ...prediction.evaluation, dataMode: "demo" }
              : undefined;
          const actualMarket = focused && marketDataResult?.ok ? marketDataResult : null;
          const effectiveStatus = statusForPrediction(
            prediction.id,
            prediction.status,
          );
          const calculatedTargetPrice = actualMarket?.targets.calculatedTargetPrice ?? null;
          return (
            <div
              key={prediction.id}
              id={prediction.id}
              className={`scroll-mt-24 rounded-[1.35rem] transition ${focused ? "ring-3 ring-action/25 ring-offset-3 ring-offset-canvas" : ""}`}
            >
              {focused && (
                <p className="mb-2 flex items-center gap-2 px-1 text-xs font-extrabold text-action">
                  <span className="size-1.5 rounded-full bg-action" /> 분석 결과에서 선택한 예측
                </p>
              )}
              {focused && marketDataResult ? (
                <div className="mb-3">
                  <PredictionMarketData result={marketDataResult} compact />
                </div>
              ) : null}
              <PredictionCard
                variant="list"
                prefetch={focused ? false : undefined}
                analysisMode={focused ? analysisInput?.analysisMode : undefined}
                href={
                  focused && analysisInput
                    ? appendAnalysisInput(`/predictions/${prediction.id}`, analysisInput)
                    : `/predictions/${prediction.id}`
                }
                influencerName={focused && analysisInput ? analysisInput.influencerName : influencer.displayName}
                stockName={actualMarket?.company.corpName ?? overrides?.stockLabel ?? stock.name}
                stockSymbol={actualMarket ? `${actualMarket.market} · ${actualMarket.stockCode}` : overrides?.stockLabel ? undefined : `${stock.market} · ${stock.symbol}`}
                originalText={focused && analysisInput ? analysisInput.statement : statement.text}
                statementType={
                  focused ? analysisInput?.structuredAnalysis?.statementType : undefined
                }
                prediction={{
                  id: prediction.id,
                  statedAt: actualMarket
                    ? formatKoreanDate(actualMarket.statementDate)
                    : formatKoreanDate(prediction.statedAt),
                  priceAtStatement: actualMarket
                    ? {
                        price: { amount: actualMarket.priceAtStatement.close, currency: "KRW" },
                        capturedAt: formatKoreanDate(actualMarket.priceAtStatement.date),
                        sourceLabel: actualMarket.provider.displayName,
                        dataMode: "actual",
                      }
                    : overrides
                      ? {
                          capturedAt: analysisInput?.statementDate
                            ? formatKoreanDate(analysisInput.statementDate)
                            : "기준일 미지정",
                          sourceLabel:
                            marketDataResult && !marketDataResult.ok
                              ? marketDataResult.message
                              : "실제 주가를 확인하지 못했습니다.",
                          dataMode: "unavailable",
                        }
                      : {
                        ...prediction.priceAtStatement,
                        capturedAt: formatKoreanDate(prediction.priceAtStatement.capturedAt),
                        dataMode: "demo",
                      },
                  direction: overrides ? overrides.direction : prediction.direction,
                  targetReturnPct: overrides ? overrides.targetReturnPct : prediction.targetReturnPct,
                  targetPrice: overrides
                    ? overrides.targetPrice ?? (calculatedTargetPrice === null
                        ? undefined
                        : { amount: calculatedTargetPrice, currency: "KRW" })
                    : prediction.targetPrice,
                  horizonLabel: overrides ? overrides.horizonLabel : prediction.horizonLabel,
                  evaluationDueAt: overrides
                    ? marketDataResult?.assessment.dueDate
                      ? formatKoreanDate(marketDataResult.assessment.dueDate)
                      : undefined
                    : prediction.evaluationDueAt
                      ? formatKoreanDate(prediction.evaluationDueAt)
                      : undefined,
                  missingConditions: overrides ? overrides.missingConditions : prediction.missingConditions,
                  status: effectiveStatus,
                  evaluation:
                    evaluation && evaluation.targetReached !== null
                      ? {
                          ...evaluation,
                          evaluatedAt:
                            evaluation.dataMode === "actual"
                              ? evaluation.evaluatedAt
                              : formatKoreanDate(evaluation.evaluatedAt),
                          targetReached: evaluation.targetReached,
                        }
                      : undefined,
                }}
              />
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="surface-card mt-6 p-10 text-center">
          <Layers3 aria-hidden="true" className="mx-auto size-8 text-slate-300" />
          <p className="mt-3 text-sm font-extrabold text-ink">이 상태의 예측이 없습니다</p>
          <button type="button" onClick={() => setFilter("all")} className="mt-3 min-h-11 rounded-xl px-4 text-sm font-bold text-action hover:bg-blue-50">전체 예측 보기</button>
        </div>
      )}
    </div>
  );
}
