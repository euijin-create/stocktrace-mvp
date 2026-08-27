import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Eye,
  FileCheck2,
  FilePenLine,
  History,
  Layers3,
  Megaphone,
  Quote,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { FactCheckCard } from "@/components/fact-check-card";
import { MetricCard } from "@/components/metric-card";
import { PredictionCard } from "@/components/prediction-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { influencers } from "@/data/mock-data";
import {
  PLATFORM_LABEL,
  VERIFICATION_STATUS_META,
  formatKoreanDate,
  formatPercent,
  formatPercentPoint,
  formatRatio,
  formatRatioPercent,
  getFactCheckView,
  getFeaturedInfluencerProfiles,
  getInfluencerProfileView,
  getPredictionView,
  ratioToPercent,
  type SemanticTone,
} from "@/lib/stocktrace";

type PageProps = { params: Promise<{ slug: string }> };

const toneMap: Record<SemanticTone, StatusTone> = {
  positive: "success",
  information: "info",
  caution: "warning",
  negative: "danger",
  neutral: "neutral",
};

export function generateStaticParams() {
  return influencers.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const view = getInfluencerProfileView(slug);
  return {
    title: view ? `${view.influencer.displayName} 검증 프로필` : "인플루언서 프로필",
    description: view ? `${view.influencer.displayName}의 발언·팩트체크·예측을 항목별로 확인합니다.` : "StockTrace 인플루언서 프로필",
  };
}

export default async function InfluencerProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const view = getInfluencerProfileView(slug);
  if (!view) notFound();

  const { influencer, profile } = view;
  const metrics = profile.metrics;
  const factViews = view.factChecks.map(({ id }) => getFactCheckView(id)).filter((item) => item !== undefined);
  const predictionViews = view.predictions.map(({ id }) => getPredictionView(id)).filter((item) => item !== undefined);
  const otherProfiles = getFeaturedInfluencerProfiles().filter((item) => item.influencer.id !== influencer.id);
  const sampleProgress = Math.min(100, Math.round((metrics.totalSampleCount / profile.sampleAssessment.recommendedMinimum) * 100));
  const limited = profile.sampleAssessment.level === "limited";

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <nav aria-label="현재 위치" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/" className="rounded-md py-1 hover:text-ink">홈</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link href="/influencers" className="rounded-md py-1 hover:text-ink">인플루언서 프로필</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span aria-current="page" className="text-ink">{influencer.displayName}</span>
      </nav>

      <section className="surface-card mt-5 overflow-hidden" aria-labelledby="profile-title">
        <div className="soft-grid bg-[#102f3e] p-5 text-white sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-white/12 text-xl font-black ring-1 ring-white/15">{influencer.avatarInitials}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 id="profile-title" className="truncate text-2xl font-black tracking-[-0.035em] sm:text-3xl">{influencer.displayName}</h1>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-cyan-100">{PLATFORM_LABEL[influencer.platform]}</span>
                </div>
                <p className="mt-1.5 truncate text-sm font-semibold text-slate-300">{influencer.channelName}</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{influencer.summary}</p>
              </div>
            </div>
            <div className="w-fit rounded-2xl border border-white/15 bg-white/8 px-4 py-3">
              <p className="text-[11px] font-bold text-slate-300">평가에 사용된 전체 표본</p>
              <p className="number-tabular mt-1 text-2xl font-black">{metrics.totalSampleCount}<span className="ml-1 text-sm font-bold text-slate-300">건</span></p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={limited ? "warning" : "success"}>
                {limited ? "표본 제한적 · 잠정 지표" : "표본 비교 가능"}
              </StatusBadge>
              <span className="text-xs font-semibold text-muted">산출 기준 {formatKoreanDate(profile.calculatedAt)}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{profile.sampleAssessment.message}</p>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>권장 표본까지</span><span className="number-tabular">{metrics.totalSampleCount}/{profile.sampleAssessment.recommendedMinimum}건</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="권장 표본 확보율" aria-valuemin={0} aria-valuemax={100} aria-valuenow={sampleProgress}>
              <div className={`h-full rounded-full ${limited ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${sampleProgress}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">표본 수는 지표의 안정성을 돕지만, 개인의 신뢰도를 확정하지는 않습니다.</p>
          </div>
        </div>
      </section>

      <DemoNotice compact className="mt-5" />

      <section className="mt-8" aria-labelledby="summary-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] text-brand">PROFILE OVERVIEW</p>
            <h2 id="summary-title" className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink">분석 표본 구성</h2>
          </div>
          <p className="hidden text-xs text-muted sm:block">단일 종합점수는 제공하지 않습니다</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SummaryCount icon={Quote} label="분석된 전체 발언" value={`${metrics.analyzedStatements}건`} />
          <SummaryCount icon={FileCheck2} label="사실 확인 대상" value={`${metrics.factCheckEligible}건`} />
        </div>
      </section>

      <section className="mt-9" aria-labelledby="dimensions-title">
        <div>
          <p className="text-xs font-extrabold tracking-[0.12em] text-brand">MULTI-DIMENSION REVIEW</p>
          <h2 id="dimensions-title" className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink">항목별 관찰 결과</h2>
          <p className="mt-2 text-sm leading-6 text-muted">각 지표의 분모와 의미가 다르므로 서로 독립적으로 살펴보세요.</p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3 lg:items-start">
          <MetricGroup
            icon={ShieldCheck}
            title="정보 신뢰성"
            description="사실 확인 결과와 출처 표현을 함께 확인합니다."
            primaryLabel="공식자료와 일치한 비율"
            primaryValue={formatRatioPercent(metrics.officialAgreement)}
            primaryDetail={`${formatRatio(metrics.officialAgreement)}건 · 팩트체크 대상 기준`}
            detailLabel="출처·표현 세부 지표"
            tone="emerald"
          >
            <MetricCard
              icon={FileCheck2}
              label="출처 제시 수준"
              value={formatRatioPercent(metrics.sourceCitation)}
              detail={`${formatRatio(metrics.sourceCitation)}건에서 출처 표현 관찰`}
              progress={ratioToPercent(metrics.sourceCitation) ?? 0}
              tone="blue"
            />
            <MetricCard
              icon={Megaphone}
              label="과장 표현 사용 정도"
              value={formatRatioPercent(metrics.exaggerationFlags)}
              detail={`${formatRatio(metrics.exaggerationFlags)}건에서 맥락 확인 필요 표현 관찰`}
              progress={ratioToPercent(metrics.exaggerationFlags) ?? 0}
              tone="amber"
            />
          </MetricGroup>

          <MetricGroup
            icon={TrendingUp}
            title="예측 성과"
            description="완료된 예측을 시장 결과와 분리해 살펴봅니다."
            primaryLabel="평균 시장 대비 예측 성과"
            primaryValue={formatPercentPoint(metrics.predictionPerformance.averageExcessReturnPct)}
            primaryDetail={`실제 평균 ${formatPercent(metrics.predictionPerformance.averageActualReturnPct)} · 시장 ${formatPercent(metrics.predictionPerformance.averageBenchmarkReturnPct)}`}
            detailLabel="예측 표본·도달 지표"
            tone="blue"
          >
            <MetricCard
              icon={Target}
              label="기록된 미래 예측"
              value={`${metrics.predictionsRecorded}건`}
              detail="평가조건 충족 여부와 관계없이 기록된 전체 예측"
              tone="brand"
            />
            <MetricCard
              icon={CheckCircle2}
              label="평가 완료 예측"
              value={`${metrics.predictionsCompleted}건`}
              detail="예측기간이 끝나 실제 결과와 비교된 표본"
              tone="emerald"
            />
            <MetricCard
              icon={Target}
              label="목표 도달 비율"
              value={formatRatioPercent(metrics.predictionPerformance.targetReached)}
              detail={`${formatRatio(metrics.predictionPerformance.targetReached)}건 · 완료 예측 기준`}
              progress={ratioToPercent(metrics.predictionPerformance.targetReached) ?? 0}
              tone="brand"
            />
          </MetricGroup>

          <MetricGroup
            icon={Scale}
            title="투명성 및 기록"
            description="공개된 이해관계와 콘텐츠의 객관적 변경 이력을 봅니다."
            primaryLabel="이해관계 공개 여부"
            primaryValue={formatRatioPercent(metrics.interestDisclosure)}
            primaryDetail={`관련 표본 ${metrics.interestDisclosure.denominator}건 중 ${metrics.interestDisclosure.numerator}건 공개`}
            detailLabel="콘텐츠 변경·정정 이력"
            tone="emerald"
          >
            <HistoryMetric icon={History} label="콘텐츠 수정 이력" value={`${metrics.contentHistory.modified}건`} description="기록 후 수정 상태가 관찰된 콘텐츠" />
            <HistoryMetric icon={Eye} label="삭제·비공개 이력" value={`${metrics.contentHistory.deletedOrUnavailable}건`} description="원본 URL의 객관적인 접근 상태" />
            <HistoryMetric icon={FilePenLine} label="정정 이력" value={`${metrics.corrections}건`} description="이후 정정 표현이 확인된 콘텐츠" />
          </MetricGroup>
        </div>
      </section>

      <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-8">
          {factViews.length > 0 && (
            <section aria-labelledby="recent-facts-title">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.12em] text-brand">RECENT FACT CHECK</p>
                  <h2 id="recent-facts-title" className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink">최근 팩트체크</h2>
                </div>
                <Link href="/analyze" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-action hover:bg-blue-50">새 분석 <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {factViews.slice(0, 2).map((factView) => {
                  const meta = VERIFICATION_STATUS_META[factView.factCheck.status];
                  return (
                    <FactCheckCard
                      key={factView.factCheck.id}
                      compact
                      href={factView.href}
                      statement={factView.statement.text}
                      influencer={factView.influencer.displayName}
                      stock={factView.factCheck.companyOrStockLabel}
                      statusLabel={meta.label}
                      statusTone={toneMap[meta.tone]}
                      summary={factView.factCheck.summary}
                      sourceName={factView.sources[0]?.organization ?? "공식자료"}
                      checkedDate={formatKoreanDate(factView.factCheck.checkedAt)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {predictionViews.length > 0 && (
            <section aria-labelledby="recent-predictions-title">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.12em] text-brand">PREDICTION HISTORY</p>
                  <h2 id="recent-predictions-title" className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink">기록된 미래 예측</h2>
                </div>
                <Link href="/predictions" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-action hover:bg-blue-50">전체 보기 <ArrowRight aria-hidden="true" className="size-4" /></Link>
              </div>
              <div className="mt-4 space-y-4">
                {predictionViews.slice(0, 2).map(({ prediction, statement, stock }) => {
                  const evaluation = prediction.evaluation;
                  return (
                    <PredictionCard
                      key={prediction.id}
                      compact
                      href={`/predictions/${prediction.id}`}
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
                        evaluation: evaluation && evaluation.targetReached !== null ? { ...evaluation, evaluatedAt: formatKoreanDate(evaluation.evaluatedAt), targetReached: evaluation.targetReached } : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="surface-card p-5">
            <div className="flex items-center gap-2">
              <Layers3 aria-hidden="true" className="size-4.5 text-brand" />
              <h2 className="text-sm font-black text-ink">표본 해석 가이드</h2>
            </div>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-muted">
              <li className="flex gap-2"><CircleDot aria-hidden="true" className="mt-1 size-3 shrink-0 text-brand" /> 비율 옆의 분자·분모를 함께 확인하세요.</li>
              <li className="flex gap-2"><CircleDot aria-hidden="true" className="mt-1 size-3 shrink-0 text-brand" /> 조건 불충분 예측은 성과 표본에서 제외합니다.</li>
              <li className="flex gap-2"><CircleDot aria-hidden="true" className="mt-1 size-3 shrink-0 text-brand" /> 콘텐츠 유형과 시장 환경에 따라 결과가 달라질 수 있습니다.</li>
            </ul>
          </div>

          <div className="surface-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-black text-ink"><UserRound aria-hidden="true" className="size-4.5 text-brand" /> 다른 관심 프로필</h2>
            <div className="mt-3 space-y-2">
              {otherProfiles.map(({ influencer: other, profile: otherProfile }) => (
                <Link key={other.id} href={`/influencers/${other.slug}`} className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-3 transition hover:bg-[#edf5f5]">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-black text-white">{other.avatarInitials}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-ink">{other.displayName}</span><span className="block text-[11px] text-muted">표본 {otherProfile.metrics.totalSampleCount}건</span></span>
                  <ChevronRight aria-hidden="true" className="size-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>

          {limited && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
              <p className="flex items-center gap-2 font-extrabold"><AlertTriangle aria-hidden="true" className="size-4" /> 잠정 프로필</p>
              <p className="mt-1.5">표본이 추가되면 현재 비율과 평균은 크게 달라질 수 있습니다.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function SummaryCount({ icon: Icon, label, value }: { icon: typeof Quote; label: string; value: string }) {
  return (
    <article className="surface-card p-4 sm:p-5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-[#e8f2f2] text-brand"><Icon aria-hidden="true" className="size-4.5" /></span>
      <p className="mt-4 text-xs font-semibold leading-5 text-muted">{label}</p>
      <p className="number-tabular mt-1 text-2xl font-black tracking-[-0.03em] text-ink">{value}</p>
    </article>
  );
}

type MetricGroupTone = "brand" | "blue" | "emerald";

const metricGroupTones: Record<MetricGroupTone, { icon: string; value: string }> = {
  brand: { icon: "bg-[#e7f1f2] text-brand", value: "text-brand" },
  blue: { icon: "bg-blue-50 text-blue-700", value: "text-blue-700" },
  emerald: { icon: "bg-emerald-50 text-emerald-700", value: "text-emerald-700" },
};

function MetricGroup({
  icon: Icon,
  title,
  description,
  primaryLabel,
  primaryValue,
  primaryDetail,
  detailLabel,
  tone,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
  primaryLabel: string;
  primaryValue: string;
  primaryDetail: string;
  detailLabel: string;
  tone: MetricGroupTone;
  children: ReactNode;
}) {
  const toneStyle = metricGroupTones[tone];

  return (
    <article className="surface-card overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneStyle.icon}`}>
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-ink">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-600">{primaryLabel}</p>
          <p className={`number-tabular mt-2 text-3xl font-black tracking-[-0.035em] ${toneStyle.value}`}>{primaryValue}</p>
          <p className="mt-1.5 text-xs leading-5 text-muted">{primaryDetail}</p>
        </div>
      </div>

      <details className="group border-t border-line">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-5 text-sm font-extrabold text-ink transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-action [&::-webkit-details-marker]:hidden">
          <span>{detailLabel}</span>
          <ChevronDown aria-hidden="true" className="size-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-3 border-t border-line bg-slate-50/70 p-4">{children}</div>
      </details>
    </article>
  );
}

function HistoryMetric({ icon: Icon, label, value, description }: { icon: typeof History; label: string; value: string; description: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3"><Icon aria-hidden="true" className="size-5 text-brand" /><span className="number-tabular text-xl font-black text-ink">{value}</span></div>
      <h3 className="mt-3 text-sm font-extrabold text-ink">{label}</h3>
      <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
    </article>
  );
}
