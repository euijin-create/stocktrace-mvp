import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileText,
  Gauge,
  Info,
  LineChart,
  Scale,
  Target,
  UserRound,
} from "lucide-react";
import { AnalysisInputSummary } from "@/components/analysis-input-summary";
import { PredictionCard } from "@/components/prediction-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { predictions } from "@/data/mock-data";
import {
  appendAnalysisInput,
  readAnalysisInputFromRecord,
  type AnalysisSearchParams,
} from "@/lib/mock-analysis";
import {
  formatKoreanDate,
  formatMoney,
  formatPercent,
  formatPercentPoint,
  getPredictionView,
  PREDICTION_STATUS_META,
  type SemanticTone,
} from "@/lib/stocktrace";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<AnalysisSearchParams>;
};

const toneMap: Record<SemanticTone, StatusTone> = {
  positive: "success",
  information: "info",
  caution: "warning",
  negative: "danger",
  neutral: "neutral",
};

export function generateStaticParams() {
  return predictions.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const view = getPredictionView(id);
  return {
    title: view ? `${view.stock.name} 예측 추적` : "예측 추적 상세",
    description: view?.statement.text ?? "StockTrace 예측 평가 예시",
  };
}

export default async function PredictionDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const view = getPredictionView(id);
  if (!view) notFound();

  const { prediction, statement, influencer, stock, receipt } = view;
  const analysisInput = readAnalysisInputFromRecord(query);
  const preserveAnalysisInput = (href: string) =>
    analysisInput ? appendAnalysisInput(href, analysisInput) : href;
  const evaluation = prediction.evaluation;
  const statusMeta = PREDICTION_STATUS_META[prediction.status];
  const targetSummary = prediction.targetReturnPct !== undefined
    ? formatPercent(prediction.targetReturnPct)
    : prediction.targetPrice
      ? formatMoney(prediction.targetPrice)
      : "조건 미지정";
  const targetDetail = [
    prediction.targetPrice ? `목표가 ${formatMoney(prediction.targetPrice)}` : null,
    prediction.horizonLabel ? `기간 ${prediction.horizonLabel}` : null,
  ].filter((value): value is string => Boolean(value)).join(" · ");
  const targetReachedLabel = evaluation?.targetReached === null
    ? "평가 제외"
    : evaluation?.targetReached
      ? "도달"
      : evaluation
        ? "미도달"
        : prediction.status === "insufficient_conditions"
          ? "평가 제외"
          : "평가 전";
  const cardEvaluation = evaluation && evaluation.targetReached !== null
    ? { ...evaluation, evaluatedAt: formatKoreanDate(evaluation.evaluatedAt), targetReached: evaluation.targetReached }
    : undefined;

  const priceRange = evaluation && prediction.targetPrice
    ? buildPriceRange(
        prediction.priceAtStatement.price.amount,
        evaluation.observedLowPrice?.amount,
        evaluation.observedHighPrice?.amount,
        evaluation.endPrice.amount,
        prediction.targetPrice.amount,
      )
    : undefined;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/" className="rounded-md py-1 hover:text-ink">홈</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link href="/predictions" className="rounded-md py-1 hover:text-ink">예측 추적</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span aria-current="page" className="text-ink">{stock.name}</span>
      </nav>

      <div className="mb-7 mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-brand">PREDICTION DETAIL</p>
          <h1 className="mt-2 balance-text text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">예측 추적 상세</h1>
          <p className="mt-3 text-sm leading-6 text-muted">발언 시점부터 평가일까지, 미리 기록한 조건으로 결과를 확인합니다.</p>
        </div>
        <Link href={preserveAnalysisInput(`/predictions?focus=${prediction.id}`)} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-extrabold text-ink hover:bg-slate-50">
          <ArrowLeft aria-hidden="true" className="size-4" /> 전체 목록
        </Link>
      </div>

      <section id="prediction-overview" className="surface-card scroll-mt-24 overflow-hidden" aria-labelledby="prediction-overview-title">
        <div className="border-b border-line bg-[#f8fbfa] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold tracking-[0.12em] text-brand">평가 요약</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 id="prediction-overview-title" className="text-xl font-black tracking-[-0.025em] text-ink">
                  {stock.name} 예측 결과
                </h2>
                <span className="text-xs font-semibold text-muted">{stock.market} · {stock.symbol}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-muted">
                {analysisInput?.influencerName ?? influencer.displayName}
              </p>
            </div>
            <StatusBadge tone={toneMap[statusMeta.tone]} className="min-h-9 px-3 text-sm">
              {statusMeta.label}
            </StatusBadge>
          </div>

          <blockquote className="mt-5 rounded-2xl border-l-4 border-brand bg-white px-5 py-4 text-base font-extrabold leading-7 text-ink sm:text-lg sm:leading-8">
            “{analysisInput?.statement ?? statement.text}”
          </blockquote>
        </div>

        <div className="p-5 sm:p-7">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewMetric label="예측 목표" value={targetSummary} detail={targetDetail || "목표 조건 확인 필요"} />
            <OverviewMetric
              label="실제 결과"
              value={evaluation ? formatPercent(evaluation.actualReturnPct) : prediction.status === "insufficient_conditions" ? "평가 제외" : "평가 전"}
              detail={evaluation ? `${formatKoreanDate(evaluation.evaluatedAt)} 기준` : statusMeta.description}
            />
            <OverviewMetric
              label="시장 대비 성과"
              value={evaluation ? formatPercentPoint(evaluation.excessReturnPct) : prediction.status === "insufficient_conditions" ? "평가 제외" : "평가 전"}
              detail={evaluation ? `${evaluation.benchmarkName} ${formatPercent(evaluation.benchmarkReturnPct)}` : statusMeta.description}
            />
            <OverviewMetric label="목표 도달 여부" value={targetReachedLabel} detail={statusMeta.label} />
          </dl>

          <div className="mt-5 rounded-2xl bg-[#102f3e] p-5 text-white">
            <p className="text-xs font-bold text-cyan-200">최종 평가</p>
            <p className="mt-2 text-[15px] font-semibold leading-7">
              {evaluation?.finalAssessment ?? statusMeta.description}
            </p>
          </div>
        </div>
      </section>

      <DemoNotice compact className="mt-4" />

      <details id="evaluation-detail" className="group surface-card mt-6 scroll-mt-24 overflow-hidden">
        <summary className="flex min-h-18 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <span>
            <span className="block text-sm font-black text-ink">상세 평가</span>
            <span className="mt-1 block text-xs leading-5 text-muted">가격 범위, 최대하락률과 시장 대비 계산 방식을 확인합니다.</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-line px-5 pb-6 pt-5 sm:px-6">
      {evaluation ? (
        <section id="evaluation-breakdown" aria-labelledby="evaluation-title">
          <div className="mb-4">
            <p className="text-xs font-extrabold tracking-[0.12em] text-brand">EVALUATION BREAKDOWN</p>
            <h2 id="evaluation-title" className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink">평가 결과 자세히 보기</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2f2] text-brand"><LineChart aria-hidden="true" className="size-5" /></span>
                <div>
                  <h3 className="text-base font-black text-ink">평가기간 가격 범위</h3>
                  <p className="mt-1 text-xs leading-5 text-muted">발언일 가격·기간 내 저가와 고가·평가일 종가를 함께 표시합니다.</p>
                </div>
              </div>

              {priceRange && (
                <div className="mt-8 px-2 pb-3">
                  <div className="relative h-2 rounded-full bg-slate-200">
                    <div className="absolute inset-y-0 rounded-full bg-[#8cb7bd]" style={{ left: `${priceRange.low}%`, right: `${100 - priceRange.high}%` }} />
                    {priceRange.points.map((point) => (
                      <div key={point.label} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${point.position}%` }}>
                        <span className={`block size-3 rounded-full border-2 border-white shadow ${point.emphasis ? "bg-action" : "bg-brand"}`} />
                        <span className={`absolute left-1/2 w-max -translate-x-1/2 text-center text-[10px] font-bold ${point.side === "top" ? "bottom-5" : "top-5"} ${point.emphasis ? "text-action" : "text-muted"}`}>
                          {point.label}<br /><span className="number-tabular">{point.price.toLocaleString("ko-KR")}원</span>
                        </span>
                      </div>
                    ))}
                    {prediction.targetPrice && (
                      <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${priceRange.target}%` }}>
                        <span className="block h-8 w-0.5 border-l-2 border-dashed border-rose-400" />
                        <span className="absolute left-1/2 top-6 w-max -translate-x-1/2 text-center text-[10px] font-bold text-rose-700">목표가<br />{formatMoney(prediction.targetPrice)}</span>
                      </div>
                    )}
                  </div>
                  <div className="h-20" aria-hidden="true" />
                  <p className="text-center text-[11px] leading-5 text-muted">도식은 상대 위치를 보여주는 예시이며, 일별 주가 차트가 아닙니다.</p>
                </div>
              )}
            </div>

            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Scale aria-hidden="true" className="size-5 text-brand" />
                <h3 className="text-base font-black text-ink">시장 대비 계산</h3>
              </div>
              <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl bg-slate-950 px-4 py-5 text-center text-white">
                <div>
                  <p className="text-[10px] text-slate-400">실제</p>
                  <p className="number-tabular mt-1 font-black">{formatPercent(evaluation.actualReturnPct)}</p>
                </div>
                <span className="font-bold text-slate-500">−</span>
                <div>
                  <p className="text-[10px] text-slate-400">{evaluation.benchmarkName}</p>
                  <p className="number-tabular mt-1 font-black">{formatPercent(evaluation.benchmarkReturnPct)}</p>
                </div>
                <span className="font-bold text-slate-500">=</span>
                <div>
                  <p className="text-[10px] text-cyan-200">시장 대비</p>
                  <p className="number-tabular mt-1 font-black text-cyan-200">{formatPercentPoint(evaluation.excessReturnPct)}</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">목표가 미도달과 시장 대비 초과성과는 서로 다른 지표입니다. 둘 중 하나만으로 예측 전체를 평가하지 않습니다.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ResultNote icon={CalendarDays} title="평가 기준일" value={formatKoreanDate(evaluation.evaluatedAt)} description="사전에 기록된 예측기간 종료일" />
            <ResultNote icon={Gauge} title="최대하락률" value={formatPercent(evaluation.maxDrawdownPct)} description="평가기간 중 발언일 가격 대비 저점" />
            <ResultNote icon={Target} title="목표가격 도달" value={evaluation.targetReached ? "도달" : "미도달"} description="기간 중 고가를 포함해 확인" />
          </div>
        </section>
      ) : prediction.status === "insufficient_conditions" ? (
        <section id="evaluation-conditions" className="p-1 sm:p-2" aria-labelledby="conditions-title">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-800"><AlertTriangle aria-hidden="true" className="size-5" /></span>
            <div>
              <h2 id="conditions-title" className="text-lg font-black text-ink">평가조건 불충분</h2>
              <p className="mt-1.5 text-sm leading-6 text-muted">객관적인 사후 평가를 위해 아래 조건이 더 필요합니다.</p>
            </div>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["상승·하락 방향", !prediction.missingConditions.includes("direction")],
              ["목표 수익률 또는 가격", !prediction.missingConditions.includes("target")],
              ["구체적인 예측기간", !prediction.missingConditions.includes("period")],
            ].map(([label, complete]) => (
              <li key={String(label)} className={`flex items-center gap-2 rounded-xl border p-4 text-sm font-bold ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                <CircleDot aria-hidden="true" className="size-4 shrink-0" />
                {String(label)} · {complete ? "확인" : "미지정"}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex gap-2 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-900"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> 이 발언은 실패 예측으로 계산하지 않으며 인플루언서의 예측 성과 표본에서도 제외합니다.</p>
        </section>
      ) : (
        <section id="evaluation-tracking" className="p-6 text-center" aria-labelledby="tracking-title">
          <BarChart3 aria-hidden="true" className="mx-auto size-8 text-brand" />
          <h2 id="tracking-title" className="mt-3 text-lg font-black text-ink">아직 추적 중인 예측입니다</h2>
          <p className="mt-2 text-sm leading-6 text-muted">평가 예정일 이후 실제 주가와 비교 시장지수 결과가 추가됩니다.</p>
        </section>
      )}
        </div>
      </details>

      <details className="group surface-card mt-4 overflow-hidden">
        <summary className="flex min-h-18 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <span>
            <span className="block text-sm font-black text-ink">발언 기록</span>
            <span className="mt-1 block text-xs leading-5 text-muted">발언 당시 조건, 입력 원문과 연결된 영수증을 확인합니다.</span>
          </span>
          <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-line p-5 sm:p-6">
          {analysisInput && <AnalysisInputSummary input={analysisInput} className="mb-5" />}

          <PredictionCard
            href="#evaluation-detail"
            influencerName={analysisInput?.influencerName ?? influencer.displayName}
            stockName={stock.name}
            stockSymbol={`${stock.market} · ${stock.symbol}`}
            originalText={analysisInput?.statement ?? statement.text}
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
              evaluation: cardEvaluation,
            }}
          />

      <section className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="연결된 기록">
        {receipt && (
          <Link href={preserveAnalysisInput(`/receipts/${receipt.id}`)} className="surface-card group flex min-h-20 items-center justify-between gap-4 p-4 sm:p-5">
            <span className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#e8f2f2] text-brand"><FileText aria-hidden="true" className="size-5" /></span>
              <span><span className="block text-sm font-black text-ink">발언 영수증 보기</span><span className="mt-1 block text-xs text-muted">발언 당시 원문과 조건</span></span>
            </span>
            <ArrowRight aria-hidden="true" className="size-4 text-slate-400 transition group-hover:translate-x-1" />
          </Link>
        )}
        <Link href={view.influencerHref} className="surface-card group flex min-h-20 items-center justify-between gap-4 p-4 sm:p-5">
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#e8f2f2] text-brand"><UserRound aria-hidden="true" className="size-5" /></span>
            <span><span className="block text-sm font-black text-ink">{influencer.displayName} 프로필</span><span className="mt-1 block text-xs text-muted">전체 표본과 항목별 지표</span></span>
          </span>
          <ArrowRight aria-hidden="true" className="size-4 text-slate-400 transition group-hover:translate-x-1" />
        </Link>
      </section>
        </div>
      </details>
    </main>
  );
}

function OverviewMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="number-tabular mt-2 text-xl font-black tracking-[-0.02em] text-ink">{value}</dd>
      <dd className="mt-1 text-xs leading-5 text-muted">{detail}</dd>
    </div>
  );
}

function ResultNote({ icon: Icon, title, value, description }: { icon: typeof CalendarDays; title: string; value: string; description: string }) {
  return (
    <article className="surface-card p-5">
      <Icon aria-hidden="true" className="size-5 text-brand" />
      <p className="mt-3 text-xs font-semibold text-muted">{title}</p>
      <p className="number-tabular mt-1 text-lg font-black text-ink">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
    </article>
  );
}

function buildPriceRange(start: number, low = start, high = start, end: number, target: number) {
  const min = Math.min(low, start, end);
  const max = Math.max(high, target, start, end);
  const padding = Math.max((max - min) * 0.12, 1);
  const lower = min - padding;
  const upper = max + padding;
  const position = (value: number) => ((value - lower) / (upper - lower)) * 100;
  return {
    low: position(low),
    high: position(high),
    target: position(target),
    points: [
      { label: "발언일", price: start, position: position(start), side: "top" as const, emphasis: false },
      { label: "평가일", price: end, position: position(end), side: "bottom" as const, emphasis: true },
    ],
  };
}
