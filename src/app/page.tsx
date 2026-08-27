import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  DatabaseZap,
  FileSearch,
  History,
  Layers3,
  Quote,
  ScanSearch,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { FactCheckCard } from "@/components/fact-check-card";
import { PredictionCard } from "@/components/prediction-card";
import { QuickAnalyzeForm } from "@/components/quick-analyze-form";
import { DemoNotice } from "@/components/ui/demo-notice";
import { SectionHeading } from "@/components/ui/section-heading";
import type { StatusTone } from "@/components/ui/status-badge";
import {
  VERIFICATION_STATUS_META,
  formatKoreanDate,
  formatPercentPoint,
  formatRatioPercent,
  getFeaturedInfluencerProfiles,
  getHomeFactChecks,
  getHomePredictions,
  type SemanticTone,
} from "@/lib/stocktrace";

const toneMap: Record<SemanticTone, StatusTone> = {
  positive: "success",
  information: "info",
  caution: "warning",
  negative: "danger",
  neutral: "neutral",
};

export default function HomePage() {
  const recentFactChecks = getHomeFactChecks().slice(0, 3);
  const completedPredictions = getHomePredictions();
  const featuredInfluencers = getFeaturedInfluencerProfiles();

  return (
    <main>
      <section className="px-4 pt-4 sm:px-6 sm:pt-7 lg:px-8">
        <div className="soft-grid relative mx-auto max-w-[1180px] overflow-hidden rounded-[1.75rem] bg-[#102f3e] px-5 py-9 text-white shadow-[0_24px_70px_rgb(15_47_62/16%)] sm:px-9 sm:py-12 lg:px-12 lg:py-14">
          <div aria-hidden="true" className="absolute -right-24 -top-20 size-80 rounded-full border border-white/7" />
          <div aria-hidden="true" className="absolute -right-7 top-10 size-44 rounded-full border border-white/7" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,.72fr)]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-bold text-cyan-100">
                <Sparkles aria-hidden="true" className="size-3.5" />
                주식 콘텐츠 검증의 새로운 기록 방식
              </span>
              <h1 className="mt-5 balance-text text-[2.35rem] font-black leading-[1.12] tracking-[-0.055em] sm:text-5xl sm:leading-[1.08] lg:text-[3.45rem]">
                들은 말은 기록하고,
                <br />결과까지 추적하세요
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-200 sm:text-base">
                StockTrace는 주식 콘텐츠 속 사실 주장과 미래 예측을 구분해 공식자료와 비교하고,
                시간이 지난 뒤 실제 결과까지 한 흐름으로 보여줍니다.
              </p>
              <QuickAnalyzeForm />

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-cyan-300" />
                  로그인 없이 체험
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-cyan-300" />
                  공식자료 기준 비교
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 aria-hidden="true" className="size-3.5 text-cyan-300" />
                  모든 수치는 예시 데이터
                </span>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative mx-auto max-w-sm rounded-[1.6rem] border border-white/15 bg-white/[.09] p-4 shadow-2xl backdrop-blur-sm">
                <div className="rounded-[1.2rem] bg-white p-5 text-ink">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-extrabold tracking-[0.12em] text-brand">TRACE #0241</p>
                      <p className="mt-1 text-sm font-black">한 달 안에 20% 상승</p>
                    </div>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <TrendingUp aria-hidden="true" className="size-4.5" />
                    </span>
                  </div>
                  <div className="relative mt-6 space-y-5 pl-7">
                    <span aria-hidden="true" className="absolute bottom-3 left-[7px] top-2 w-px bg-slate-200" />
                    {[
                      ["발언 기록", "50,000원 · 2025.03.10"],
                      ["평가조건 고정", "+20% · 1개월"],
                      ["결과 확인", "+7% · KOSPI 대비 +4%p"],
                    ].map(([title, description], index) => (
                      <div key={title} className="relative">
                        <span
                          aria-hidden="true"
                          className={`absolute -left-7 top-0.5 flex size-4 items-center justify-center rounded-full ring-4 ring-white ${index === 2 ? "bg-emerald-500" : "bg-brand"}`}
                        >
                          <span className="size-1.5 rounded-full bg-white" />
                        </span>
                        <p className="text-xs font-extrabold text-ink">{title}</p>
                        <p className="mt-1 text-xs text-muted">{description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-3.5 text-white">
                    <div>
                      <p className="text-[10px] text-slate-400">목표가 도달</p>
                      <p className="mt-1 text-sm font-extrabold">미도달</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">시장 대비</p>
                      <p className="mt-1 text-sm font-extrabold text-emerald-300">+4.0%p</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="StockTrace 핵심 원칙" className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-3 sm:p-5">
          {[
            [FileSearch, "사실과 의견을 분리", "검증 가능한 주장부터 구분합니다"],
            [History, "발언 당시 조건을 보존", "URL·날짜·주가를 함께 기록합니다"],
            [Layers3, "한 점수가 아닌 여러 지표", "표본 수와 평가 기준을 같이 봅니다"],
          ].map(([Icon, title, description]) => (
            <div key={String(title)} className="flex items-start gap-3 rounded-xl px-2 py-2 sm:px-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf3f3] text-brand">
                <Icon aria-hidden="true" className="size-4.5" />
              </span>
              <div>
                <p className="text-sm font-extrabold text-ink">{String(title)}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{String(description)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-labelledby="how-title">
        <SectionHeading
          eyebrow="HOW IT WORKS"
          title="발언이 결과가 되기까지"
          description="콘텐츠를 등록하면 검증 가능한 정보와 추적 가능한 예측을 각각의 기록으로 연결합니다."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              icon: ScanSearch,
              title: "핵심 발언 분석",
              text: "URL과 인플루언서, 확인하고 싶은 원문 발언을 직접 입력합니다.",
            },
            {
              step: "02",
              icon: BookOpenCheck,
              title: "공식자료와 비교",
              text: "확인한 자료, 작성일, 핵심 근거와 비교 결과를 함께 보여줍니다.",
            },
            {
              step: "03",
              icon: BarChart3,
              title: "미래 결과 추적",
              text: "목표와 기간을 고정하고 실제 수익률을 시장지수와 함께 평가합니다.",
            },
          ].map((item) => (
            <article key={item.step} className="surface-card relative overflow-hidden p-6">
              <span className="absolute right-5 top-4 text-4xl font-black tracking-[-0.06em] text-slate-100">{item.step}</span>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-[#e7f1f2] text-brand">
                <item.icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white/55">
        <div className="mx-auto max-w-[1180px] px-4 py-11 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeading
            eyebrow="RECENT FACT CHECKS"
            title="최근 팩트체크"
            description="발언과 공식자료에서 확인된 범위를 나란히 살펴보세요."
            action={
              <Link href="/analyze" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-extrabold text-action hover:bg-blue-50">
                내 콘텐츠 분석하기 <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            }
          />
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {recentFactChecks.map((view) => {
              const meta = VERIFICATION_STATUS_META[view.factCheck.status];
              return (
                <FactCheckCard
                  key={view.factCheck.id}
                  variant="home"
                  href={view.href}
                  statement={view.statement.text}
                  influencer={view.influencer.displayName}
                  stock={view.factCheck.companyOrStockLabel}
                  statusLabel={meta.label}
                  statusTone={toneMap[meta.tone]}
                  summary={view.factCheck.summary}
                  sourceName={view.sources[0]?.organization ?? "공식자료 확인 중"}
                  checkedDate={formatKoreanDate(view.factCheck.checkedAt)}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-11 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="PREDICTION TRACKING"
          title="최근 평가가 완료된 예측"
          description="목표 달성 여부와 실제 수익률, 같은 기간 시장 성과를 분리해 확인합니다."
          action={
            <Link href="/predictions" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-extrabold text-action hover:bg-blue-50">
              전체 예측 보기 <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          }
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {completedPredictions.map(({ prediction, statement, influencer, stock }) => {
            const evaluation = prediction.evaluation;
            return (
              <PredictionCard
                key={prediction.id}
                variant="home"
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
                  evaluationDueAt: formatKoreanDate(prediction.evaluationDueAt),
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
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-[#edf3f4]">
        <div className="mx-auto max-w-[1180px] px-4 py-11 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeading
            eyebrow="WATCHLIST"
            title="관심 인플루언서"
            description="단일 신뢰점수 대신, 표본과 항목별 관찰 결과를 확인합니다."
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {featuredInfluencers.map(({ influencer, profile }) => (
              <Link
                key={influencer.id}
                href={`/influencers/${influencer.slug}`}
                className="surface-card group flex min-h-56 flex-col p-5 transition hover:-translate-y-0.5 hover:border-[#adc3ca] sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-sm font-black text-white">
                    {influencer.avatarInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-black text-ink">{influencer.displayName}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted">{influencer.channelName}</p>
                  </div>
                  <ArrowRight aria-hidden="true" className="size-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold text-muted">공식자료 일치</p>
                    <p className="number-tabular mt-1 text-lg font-black text-ink">{formatRatioPercent(profile.metrics.officialAgreement)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold text-muted">시장 대비 성과</p>
                    <p className="number-tabular mt-1 text-lg font-black text-ink">
                      {formatPercentPoint(profile.metrics.predictionPerformance.averageExcessReturnPct)}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-muted">
                    <Quote aria-hidden="true" className="size-3.5" />
                    전체 표본 {profile.metrics.totalSampleCount}건
                  </span>
                  <span className={`inline-flex items-center gap-1 font-bold ${profile.sampleAssessment.level === "limited" ? "text-amber-800" : "text-emerald-700"}`}>
                    <CircleDot aria-hidden="true" className="size-3" />
                    {profile.sampleAssessment.level === "limited" ? "표본 제한적" : "표본 비교 가능"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 py-11 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <DemoNotice />
          <Link
            href="/analyze"
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-extrabold text-white transition hover:bg-[#1c4053]"
          >
            <DatabaseZap aria-hidden="true" className="size-4.5" />
            데모 분석 시작하기
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
