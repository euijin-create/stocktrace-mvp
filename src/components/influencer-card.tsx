import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileCheck2,
  Info,
  Layers3,
  Megaphone,
  Quote,
  Scale,
  ShieldCheck,
  Target,
} from "lucide-react";

export interface CountRatio {
  numerator: number;
  denominator: number;
}

export interface InfluencerPredictionPerformance {
  averageActualReturnPct: number;
  averageBenchmarkReturnPct: number;
  averageExcessReturnPct: number;
  targetReached: CountRatio;
}

export interface InfluencerCardMetrics {
  analyzedStatements: number;
  factCheckEligible: number;
  officialAgreement: CountRatio;
  predictionsRecorded: number;
  predictionsCompleted: number;
  predictionPerformance: InfluencerPredictionPerformance;
  sourceCitation: CountRatio;
  interestDisclosure: CountRatio;
  exaggerationFlags: CountRatio;
  contentHistory: {
    modified: number;
    deletedOrUnavailable: number;
  };
  corrections: number;
  totalSampleCount: number;
}

export interface InfluencerCardPerson {
  displayName: string;
  channelName?: string;
  platform?: string;
  avatarInitials?: string;
  summary?: string;
}

export interface InfluencerSampleAssessment {
  level: "limited" | "developing" | "substantial";
  message: string;
  recommendedMinimum?: number;
}

export interface InfluencerCardProps {
  influencer: InfluencerCardPerson;
  metrics: InfluencerCardMetrics;
  sampleAssessment: InfluencerSampleAssessment;
  href: string;
  className?: string;
}

const SAMPLE_META: Record<
  InfluencerSampleAssessment["level"],
  { label: string; className: string }
> = {
  limited: {
    label: "표본 제한적",
    className: "bg-amber-50 text-amber-900 ring-amber-200",
  },
  developing: {
    label: "표본 축적 중",
    className: "bg-blue-50 text-blue-800 ring-blue-200",
  },
  substantial: {
    label: "표본 비교 가능",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  },
};

function formatRatio(ratio: CountRatio) {
  if (ratio.denominator <= 0) return "표본 없음";
  return `${Math.round((ratio.numerator / ratio.denominator) * 100)}%`;
}

function formatPct(value: number | undefined) {
  if (value === undefined) return "평가 전";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%p`;
}

function formatObservedRatio(ratio: CountRatio, prefix = "") {
  if (ratio.denominator <= 0) return "표본 없음";
  const percentage = Math.round((ratio.numerator / ratio.denominator) * 100);
  return `${prefix}${percentage}% (${ratio.numerator}/${ratio.denominator}건)`;
}

export function InfluencerCard({
  influencer,
  metrics,
  sampleAssessment,
  href,
  className = "",
}: InfluencerCardProps) {
  const sampleMeta = SAMPLE_META[sampleAssessment.level];
  const initials =
    influencer.avatarInitials ?? influencer.displayName.trim().slice(0, 2);

  return (
    <article
      className={`surface-card min-w-0 overflow-hidden p-5 sm:p-6 ${className}`}
    >
      <header className="flex min-w-0 items-start gap-3">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-sm font-bold text-white"
          aria-hidden="true"
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate text-lg font-bold tracking-tight text-slate-950">
              {influencer.displayName}
            </h2>
            {influencer.platform ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                {influencer.platform}
              </span>
            ) : null}
          </div>
          {influencer.channelName ? (
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {influencer.channelName}
            </p>
          ) : null}
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${sampleMeta.className}`}
        >
          <Layers3 aria-hidden="true" className="size-3.5" />
          {sampleMeta.label}
        </span>
      </header>

      {influencer.summary ? (
        <p className="mt-4 break-words text-sm leading-6 text-slate-600">
          {influencer.summary}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TopMetric
          icon={<Quote aria-hidden="true" className="size-4" />}
          label="분석 발언"
          value={`${metrics.analyzedStatements}건`}
        />
        <TopMetric
          icon={<FileCheck2 aria-hidden="true" className="size-4" />}
          label="팩트체크 대상"
          value={`${metrics.factCheckEligible}건`}
        />
        <TopMetric
          icon={<ShieldCheck aria-hidden="true" className="size-4" />}
          label="공식자료 일치"
          value={formatRatio(metrics.officialAgreement)}
          detail={`${metrics.officialAgreement.numerator}/${metrics.officialAgreement.denominator}건`}
        />
        <TopMetric
          icon={<Target aria-hidden="true" className="size-4" />}
          label="예측 평가 완료"
          value={`${metrics.predictionsCompleted}건`}
          detail={`기록 ${metrics.predictionsRecorded}건`}
        />
      </div>

      <section className="mt-5" aria-label="항목별 관찰 결과">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <BarChart3 aria-hidden="true" className="size-4 text-brand" />
            항목별 관찰
          </h3>
          <span className="number-tabular text-xs text-slate-500">
            전체 표본 {metrics.totalSampleCount}건
          </span>
        </div>

        <dl className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/60 px-4">
          <DimensionRow
            icon={<BarChart3 aria-hidden="true" className="size-4" />}
            label="평균 시장 대비 성과"
            value={formatPct(metrics.predictionPerformance.averageExcessReturnPct)}
          />
          <DimensionRow
            icon={<FileCheck2 aria-hidden="true" className="size-4" />}
            label="출처 제시 수준"
            value={formatObservedRatio(metrics.sourceCitation)}
          />
          <DimensionRow
            icon={<Scale aria-hidden="true" className="size-4" />}
            label="이해관계 공개"
            value={formatObservedRatio(metrics.interestDisclosure, "공개 ")}
          />
          <DimensionRow
            icon={<Megaphone aria-hidden="true" className="size-4" />}
            label="과장 표현 관찰"
            value={formatObservedRatio(metrics.exaggerationFlags, "관찰 ")}
          />
          <DimensionRow
            icon={<Layers3 aria-hidden="true" className="size-4" />}
            label="콘텐츠 변경 이력"
            value={`수정 ${metrics.contentHistory.modified}건 · 접근 불가 ${metrics.contentHistory.deletedOrUnavailable}건`}
          />
          <DimensionRow
            icon={<ShieldCheck aria-hidden="true" className="size-4" />}
            label="정정 이력"
            value={`${metrics.corrections}건`}
          />
        </dl>
      </section>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-start gap-2">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-500" />
          <div className="min-w-0">
            <p className="break-words text-xs font-semibold leading-5 text-slate-700">
              {sampleAssessment.message}
            </p>
            {sampleAssessment.recommendedMinimum ? (
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                권장 표본 {sampleAssessment.recommendedMinimum}건 · 현재 {metrics.totalSampleCount}건
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <footer className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="min-w-0 text-xs leading-5 text-slate-500">
          항목별 관찰 결과이며, 개인의 전체 신뢰도를 단정하지 않습니다.
        </p>
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-action transition-colors hover:bg-blue-50"
          aria-label={`${influencer.displayName} 프로필 보기`}
        >
          프로필
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </footer>
    </article>
  );
}

function TopMetric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <dl className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3">
      <dt className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
        <span className="shrink-0 text-brand">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="number-tabular mt-2 break-words text-lg font-bold text-slate-950">
        {value}
      </dd>
      {detail ? (
        <dd className="number-tabular mt-0.5 text-xs text-slate-500">{detail}</dd>
      ) : null}
    </dl>
  );
}

function DimensionRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 py-3">
      <dt className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
        <span className="shrink-0 text-slate-400">{icon}</span>
        <span className="break-words">{label}</span>
      </dt>
      <dd className="number-tabular shrink-0 text-right text-sm font-bold text-slate-900">
        {value}
      </dd>
    </div>
  );
}
