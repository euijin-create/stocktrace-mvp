import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Database,
  Target,
} from "lucide-react";
import type { PredictionMarketSnapshotResult } from "@/lib/market-data/types";

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatIndex(value: number): string {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatVolume(value: number | null): string {
  return value === null ? "확인되지 않음" : `${value.toLocaleString("ko-KR")}주`;
}

export function PredictionMarketData({
  result,
  compact = false,
}: {
  result: PredictionMarketSnapshotResult;
  compact?: boolean;
}) {
  if (!result.ok) {
    return (
      <aside className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4" aria-label="시장데이터 조회 안내">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-800" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink">실제 시장데이터 조회 불가</p>
            <p className="mt-1 text-xs leading-5 text-slate-700">{result.message}</p>
            {result.assessment.status === "unavailable" ? (
              <p className="mt-1 text-xs leading-5 text-slate-700">
                {result.assessment.message}
              </p>
            ) : null}
            <p className="mt-1.5 text-[11px] leading-5 text-muted">
              실제 가격 대신 다른 종목의 데모 가격을 표시하지 않습니다. 데이터 제공자 · {result.provider.displayName}
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const targetPrice = result.targets.statedTargetPrice ?? result.targets.calculatedTargetPrice;
  const assessment = result.assessment;
  const targetLabel = result.targets.statedTargetPrice !== null
    ? "발언에서 제시한 목표가격"
    : result.targets.calculatedTargetPrice !== null
      ? "목표수익률로 계산한 목표가격"
      : "목표가격";

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white" aria-labelledby="actual-market-data-title">
      <div className="flex flex-col gap-3 border-b border-emerald-100 bg-emerald-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-200">
            <Database aria-hidden="true" className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p id="actual-market-data-title" className="text-sm font-black text-ink">
              {result.company.corpName} 실제 시장데이터
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {result.market} · {result.stockCode} · {result.symbol}
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 aria-hidden="true" className="size-3.5" /> {assessment.status === "completed" ? "실제 시장데이터 기반 평가" : "실제 주가 데이터"}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <dl className={`grid gap-3 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          <MarketMetric icon={CalendarDays} label="발언일" value={result.statementDate} />
          <MarketMetric icon={CalendarDays} label="가격 기준일" value={result.priceAtStatement.date} />
          <MarketMetric icon={BarChart3} label="발언일 기준 종가" value={formatWon(result.priceAtStatement.close)} emphasized />
          {!compact ? (
            <MarketMetric
              icon={Target}
              label={targetLabel}
              value={targetPrice === null ? "미지정" : formatWon(targetPrice)}
              emphasized
            />
          ) : null}
        </dl>

        {!compact ? (
          <details className="group mt-4 rounded-xl border border-line bg-slate-50/70">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-2.5 text-xs font-extrabold text-ink">
              일별 가격과 기준지수 상세
              <span className="text-muted transition group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="border-t border-line px-4 py-4">
              <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
                <PlainMetric label="시가" value={formatWon(result.priceAtStatement.open)} />
                <PlainMetric label="고가" value={formatWon(result.priceAtStatement.high)} />
                <PlainMetric label="저가" value={formatWon(result.priceAtStatement.low)} />
                <PlainMetric label="종가" value={formatWon(result.priceAtStatement.close)} />
                <PlainMetric label="거래량" value={formatVolume(result.priceAtStatement.volume)} />
                <PlainMetric
                  label={`${result.benchmark.name} 종가`}
                  value={
                    result.benchmark.basePrice
                      ? `${formatIndex(result.benchmark.basePrice.close)} (${result.benchmark.basePrice.date})`
                      : "찾지 못함"
                  }
                />
              </dl>

              <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <PlainMetric
                  label="평가 예정일"
                  value={result.evaluation.dueDate ?? "예측 기간을 계산할 수 없음"}
                />
                <PlainMetric
                  label="평가 가격 기준일 · 평가일 종가"
                  value={
                    assessment.status === "completed"
                      ? `${assessment.evaluationPrice.date} 종가 ${formatWon(assessment.evaluationPrice.close)}`
                      : assessment.status === "tracking"
                        ? "평가 예정일 이후 조회 가능"
                        : "평가 데이터 확인 필요"
                  }
                />
              </div>
            </div>
          </details>
        ) : null}

        <p className="mt-3 text-[11px] leading-5 text-muted">
          {result.provider.note}입니다. {assessment.status === "completed"
            ? "평가기간의 실제 일별 데이터로 수익률과 기간 중 목표가 도달 여부를 계산했습니다."
            : assessment.status === "tracking"
              ? "미래 가격을 미리 조회하거나 성공·실패를 판정하지 않습니다."
              : assessment.message}
        </p>
      </div>
    </section>
  );
}

function MarketMetric({
  icon: Icon,
  label,
  value,
  emphasized = false,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
        <Icon aria-hidden="true" className="size-3.5" /> {label}
      </dt>
      <dd className={`number-tabular mt-1.5 break-words text-sm ${emphasized ? "font-black text-ink" : "font-bold text-slate-800"}`}>
        {value}
      </dd>
    </div>
  );
}

function PlainMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold text-muted">{label}</dt>
      <dd className="number-tabular mt-1 break-words text-xs font-bold leading-5 text-ink">{value}</dd>
    </div>
  );
}
