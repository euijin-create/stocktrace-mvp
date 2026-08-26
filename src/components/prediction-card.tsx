import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  Target,
  XCircle,
} from "lucide-react";

export type PredictionStatus =
  | "tracking"
  | "evaluation_due"
  | "completed"
  | "insufficient_conditions";

export type PredictionDirection = "up" | "down";

export type MissingPredictionCondition = "direction" | "target" | "period";

export interface PredictionMoney {
  amount: number;
  currency: string;
}

export interface PredictionPriceSnapshot {
  price: PredictionMoney;
  capturedAt: string;
  sourceLabel: string;
}

export interface PredictionEvaluation {
  evaluatedAt: string;
  endPrice: PredictionMoney;
  observedHighPrice?: PredictionMoney;
  observedLowPrice?: PredictionMoney;
  actualReturnPct: number;
  benchmarkName: string;
  benchmarkReturnPct: number;
  excessReturnPct: number;
  targetReached: boolean | null;
  maxDrawdownPct: number;
  finalAssessment: string;
  methodologyNote?: string;
}

export interface PredictionCardPrediction {
  id: string;
  statedAt: string;
  priceAtStatement: PredictionPriceSnapshot;
  direction?: PredictionDirection;
  targetReturnPct?: number;
  targetPrice?: PredictionMoney;
  horizonLabel?: string;
  evaluationDueAt?: string;
  missingConditions: MissingPredictionCondition[];
  status: PredictionStatus;
  evaluation?: PredictionEvaluation;
}

export interface PredictionCardProps {
  prediction: PredictionCardPrediction;
  influencerName: string;
  stockName: string;
  stockSymbol?: string;
  originalText: string;
  href: string;
  className?: string;
  compact?: boolean;
}

const STATUS_META: Record<
  PredictionStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  tracking: {
    label: "추적 중",
    className: "bg-blue-50 text-blue-800 ring-blue-200",
    icon: Clock3,
  },
  evaluation_due: {
    label: "평가 대기",
    className: "bg-amber-50 text-amber-900 ring-amber-200",
    icon: CalendarClock,
  },
  completed: {
    label: "평가 완료",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    icon: CheckCircle2,
  },
  insufficient_conditions: {
    label: "평가조건 불충분",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: AlertTriangle,
  },
};

const MISSING_CONDITION_LABEL: Record<MissingPredictionCondition, string> = {
  direction: "상승·하락 방향",
  target: "목표 수익률 또는 목표가",
  period: "예측 기간",
};

function formatMoney(money: PredictionMoney) {
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: money.currency,
      maximumFractionDigits: 0,
    }).format(money.amount);
  } catch {
    return `${money.amount.toLocaleString("ko-KR")} ${money.currency}`;
  }
}

function formatPct(value: number, point = false) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}%${point ? "p" : ""}`;
}

export function PredictionCard({
  prediction,
  influencerName,
  stockName,
  stockSymbol,
  originalText,
  href,
  className = "",
  compact = false,
}: PredictionCardProps) {
  const status = STATUS_META[prediction.status];
  const StatusIcon = status.icon;
  const DirectionIcon =
    prediction.direction === "down" ? ArrowDownRight : ArrowUpRight;
  const directionLabel =
    prediction.direction === "down"
      ? "하락 예측"
      : prediction.direction === "up"
        ? "상승 예측"
        : "방향 미지정";
  const isInsufficient = prediction.status === "insufficient_conditions";
  const evaluation = prediction.status === "completed" ? prediction.evaluation : undefined;

  return (
    <article
      className={`surface-card min-w-0 overflow-hidden p-5 sm:p-6 ${className}`}
    >
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-slate-950">{stockName}</span>
            {stockSymbol ? (
              <span className="number-tabular text-xs font-medium text-slate-500">
                {stockSymbol}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{influencerName}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.className}`}
        >
          <StatusIcon aria-hidden="true" className="size-3.5" />
          {status.label}
        </span>
      </header>

      <blockquote className="mt-4 break-words border-l-2 border-brand/30 pl-3 text-sm font-medium leading-6 text-slate-800">
        “{originalText}”
      </blockquote>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <PredictionMeta label="발언일" value={prediction.statedAt} />
        <PredictionMeta
          label="발언 당시 주가"
          value={formatMoney(prediction.priceAtStatement.price)}
          detail={prediction.priceAtStatement.sourceLabel}
        />
        <PredictionMeta
          label="예측 방향"
          value={directionLabel}
          icon={<DirectionIcon aria-hidden="true" className="size-3.5" />}
        />
        <PredictionMeta
          label="예측 기간"
          value={prediction.horizonLabel ?? "미지정"}
        />
      </dl>

      {!isInsufficient ? (
        <dl className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:grid-cols-3">
          <PredictionMeta
            label="목표 수익률"
            value={
              prediction.targetReturnPct === undefined
                ? "미지정"
                : formatPct(prediction.targetReturnPct)
            }
            emphasized
          />
          <PredictionMeta
            label="목표가격"
            value={prediction.targetPrice ? formatMoney(prediction.targetPrice) : "미지정"}
            emphasized
          />
          <PredictionMeta
            label="평가 예정일"
            value={prediction.evaluationDueAt ?? "미지정"}
            emphasized
          />
        </dl>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
            객관적 평가에 필요한 조건이 부족합니다
          </p>
          {prediction.missingConditions.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="부족한 평가 조건">
              {prediction.missingConditions.map((condition) => (
                <li
                  key={condition}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200"
                >
                  <CircleDot aria-hidden="true" className="size-3" />
                  {MISSING_CONDITION_LABEL[condition]}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs leading-5 text-slate-500">
            이 발언은 실패로 처리하지 않으며, 예측 성과 통계에 포함하지
            않습니다.
          </p>
        </div>
      )}

      {evaluation ? (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white" aria-label="예측 평가 결과">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Target aria-hidden="true" className="size-4 text-cyan-300" />
              평가 결과
            </h3>
            <span className="text-xs text-slate-400">{evaluation.evaluatedAt} 기준</span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
            <ResultMetric label="실제 수익률" value={formatPct(evaluation.actualReturnPct)} />
            <ResultMetric
              label={`${evaluation.benchmarkName} 수익률`}
              value={formatPct(evaluation.benchmarkReturnPct)}
            />
            <ResultMetric
              label="시장 대비 성과"
              value={formatPct(evaluation.excessReturnPct, true)}
            />
            <ResultMetric
              label="목표가격 도달"
              value={
                evaluation.targetReached === null
                  ? "평가 제외"
                  : evaluation.targetReached
                    ? "도달"
                    : "미도달"
              }
              icon={
                evaluation.targetReached === null ? (
                  <CircleDot aria-hidden="true" className="size-4 text-slate-300" />
                ) : evaluation.targetReached ? (
                  <CheckCircle2 aria-hidden="true" className="size-4 text-emerald-300" />
                ) : (
                  <XCircle aria-hidden="true" className="size-4 text-rose-300" />
                )
              }
            />
            <ResultMetric
              label="최대하락률"
              value={formatPct(evaluation.maxDrawdownPct)}
            />
            <ResultMetric label="종가" value={formatMoney(evaluation.endPrice)} />
          </dl>

          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-slate-400">최종 평가</p>
            <p className="mt-1 break-words text-sm font-semibold leading-6 text-white">
              {evaluation.finalAssessment}
            </p>
            {evaluation.methodologyNote && !compact ? (
              <p className="mt-2 break-words text-xs leading-5 text-slate-400">
                {evaluation.methodologyNote}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <footer className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <p className="min-w-0 truncate text-xs text-slate-500">예측 ID · {prediction.id}</p>
        <Link
          href={href}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-action transition-colors hover:bg-blue-50"
          aria-label={`${stockName} 예측 상세 보기`}
        >
          상세 보기
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </footer>
    </article>
  );
}

function PredictionMeta({
  label,
  value,
  icon,
  detail,
  emphasized = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  detail?: string;
  emphasized?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd
        className={`number-tabular mt-1 flex min-w-0 items-center gap-1 break-words text-sm ${
          emphasized ? "font-bold text-slate-950" : "font-semibold text-slate-800"
        }`}
      >
        {icon}
        <span>{value}</span>
      </dd>
      {detail ? (
        <dd className="mt-0.5 truncate text-[11px] text-slate-500" title={detail}>
          {detail}
        </dd>
      ) : null}
    </div>
  );
}

function ResultMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="break-words text-xs font-medium leading-5 text-slate-400">{label}</dt>
      <dd className="number-tabular mt-1 flex items-center gap-1.5 break-words text-base font-bold text-white">
        {icon}
        {value}
      </dd>
    </div>
  );
}
