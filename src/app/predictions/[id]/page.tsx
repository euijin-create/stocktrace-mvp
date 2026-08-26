import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
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
import { PredictionCard } from "@/components/prediction-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { predictions } from "@/data/mock-data";
import {
  formatKoreanDate,
  formatMoney,
  formatPercent,
  formatPercentPoint,
  getPredictionView,
} from "@/lib/stocktrace";

type PageProps = { params: Promise<{ id: string }> };

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

export default async function PredictionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const view = getPredictionView(id);
  if (!view) notFound();

  const { prediction, statement, influencer, stock, receipt } = view;
  const evaluation = prediction.evaluation;
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
        <Link href="/predictions" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-extrabold text-ink hover:bg-slate-50">
          <ArrowLeft aria-hidden="true" className="size-4" /> 전체 목록
        </Link>
      </div>

      <DemoNotice compact className="mb-6" />

      <PredictionCard
        href="#evaluation-detail"
        influencerName={influencer.displayName}
        stockName={stock.name}
        stockSymbol={`${stock.market} · ${stock.symbol}`}
        originalText={statement.text}
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

      {evaluation ? (
        <section id="evaluation-detail" className="mt-7 scroll-mt-24" aria-labelledby="evaluation-title">
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
        <section id="evaluation-detail" className="surface-card mt-7 scroll-mt-24 p-5 sm:p-7" aria-labelledby="conditions-title">
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
        <section id="evaluation-detail" className="surface-card mt-7 scroll-mt-24 p-6 text-center" aria-labelledby="tracking-title">
          <BarChart3 aria-hidden="true" className="mx-auto size-8 text-brand" />
          <h2 id="tracking-title" className="mt-3 text-lg font-black text-ink">아직 추적 중인 예측입니다</h2>
          <p className="mt-2 text-sm leading-6 text-muted">평가 예정일 이후 실제 주가와 비교 시장지수 결과가 추가됩니다.</p>
        </section>
      )}

      <section className="mt-7 grid gap-3 sm:grid-cols-2" aria-label="연결된 기록">
        {receipt && (
          <Link href={`/receipts/${receipt.id}`} className="surface-card group flex min-h-20 items-center justify-between gap-4 p-4 sm:p-5">
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
    </main>
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
