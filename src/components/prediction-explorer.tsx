"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, Layers3 } from "lucide-react";
import { AnalysisInputSummary } from "@/components/analysis-input-summary";
import { PredictionCard } from "@/components/prediction-card";
import { mockDatabase } from "@/data/mock-data";
import { appendAnalysisInput, readAnalysisInput } from "@/lib/mock-analysis";
import { formatKoreanDate, getPredictionView } from "@/lib/stocktrace";
import type { PredictionStatus } from "@/types/stocktrace";

type Filter = "all" | "active" | "completed" | "insufficient";

const filters: Array<{ id: Filter; label: string; icon: typeof Layers3 }> = [
  { id: "all", label: "전체", icon: Layers3 },
  { id: "active", label: "추적 중", icon: Clock3 },
  { id: "completed", label: "평가 완료", icon: CheckCircle2 },
  { id: "insufficient", label: "조건 불충분", icon: AlertTriangle },
];

function filterForStatus(status?: PredictionStatus): Filter {
  if (status === "completed") return "completed";
  if (status === "insufficient_conditions") return "insufficient";
  if (status === "tracking" || status === "evaluation_due") return "active";
  return "all";
}

export function PredictionExplorer() {
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
  const [filter, setFilter] = useState<Filter>(() => filterForStatus(focusedView?.prediction.status));

  const filtered = views.filter(({ prediction }) => {
    if (filter === "all") return true;
    if (filter === "active") return prediction.status === "tracking" || prediction.status === "evaluation_due";
    if (filter === "completed") return prediction.status === "completed";
    return prediction.status === "insufficient_conditions";
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
      {analysisInput && <AnalysisInputSummary input={analysisInput} className="mb-6" />}
      <div className="surface-card flex gap-2 overflow-x-auto p-2" role="group" aria-label="예측 상태 필터">
        {filters.map((item) => {
          const active = filter === item.id;
          const Icon = item.icon;
          const count = views.filter(({ prediction }) => {
            if (item.id === "all") return true;
            if (item.id === "active") return prediction.status === "tracking" || prediction.status === "evaluation_due";
            if (item.id === "completed") return prediction.status === "completed";
            return prediction.status === "insufficient_conditions";
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
          const evaluation = prediction.evaluation;
          const focused = focusId === prediction.id;
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
              <PredictionCard
                variant="list"
                href={
                  focused && analysisInput
                    ? appendAnalysisInput(`/predictions/${prediction.id}`, analysisInput)
                    : `/predictions/${prediction.id}`
                }
                influencerName={focused && analysisInput ? analysisInput.influencerName : influencer.displayName}
                stockName={stock.name}
                stockSymbol={`${stock.market} · ${stock.symbol}`}
                originalText={focused && analysisInput ? analysisInput.statement : statement.text}
                prediction={{
                  id: prediction.id,
                  statedAt: formatKoreanDate(prediction.statedAt),
                  priceAtStatement: {
                    ...prediction.priceAtStatement,
                    capturedAt: formatKoreanDate(prediction.priceAtStatement.capturedAt),
                  },
                  direction: prediction.direction,
                  targetReturnPct: prediction.targetReturnPct,
                  targetPrice: prediction.targetPrice,
                  horizonLabel: prediction.horizonLabel,
                  evaluationDueAt: prediction.evaluationDueAt ? formatKoreanDate(prediction.evaluationDueAt) : undefined,
                  missingConditions: prediction.missingConditions,
                  status: prediction.status,
                  evaluation:
                    evaluation && evaluation.targetReached !== null
                      ? {
                          ...evaluation,
                          evaluatedAt: formatKoreanDate(evaluation.evaluatedAt),
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
