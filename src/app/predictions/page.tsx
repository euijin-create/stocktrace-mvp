import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  CalendarClock,
  ChevronRight,
  LineChart,
  LoaderCircle,
  Scale,
  Target,
} from "lucide-react";
import { PredictionExplorer } from "@/components/prediction-explorer";
import { DemoNotice } from "@/components/ui/demo-notice";
import { getPredictionMarketSnapshot } from "@/lib/market-data";
import {
  readAnalysisInputFromRecord,
  type AnalysisSearchParams,
} from "@/lib/mock-analysis";

export const metadata: Metadata = {
  title: "예측 추적",
  description: "발언일의 조건과 이후 실제 수익률, 시장 대비 성과를 함께 추적합니다.",
};

type PageProps = {
  searchParams: Promise<AnalysisSearchParams>;
};

export default async function PredictionsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const analysisInput = readAnalysisInputFromRecord(query);
  const structuredPrediction = analysisInput?.structuredAnalysis?.statementType === "prediction"
    ? analysisInput.structuredAnalysis
    : null;
  const marketDataResult = structuredPrediction && analysisInput?.statementDate
    ? await getPredictionMarketSnapshot({
        companyNames: [structuredPrediction.company, structuredPrediction.stockName],
        direction: structuredPrediction.direction,
        predictionPeriod: structuredPrediction.predictionPeriod,
        statementDate: analysisInput.statementDate,
        targetPrice: structuredPrediction.targetPrice,
        targetReturnPercent: structuredPrediction.targetReturnPercent,
      })
    : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <nav aria-label="현재 위치" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/" className="rounded-md py-1 hover:text-ink">홈</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span aria-current="page" className="text-ink">예측 추적</span>
      </nav>

      <div className="mb-7 mt-5">
        <p className="text-sm font-extrabold text-brand">PREDICTION TRACKER</p>
        <h1 className="mt-2 balance-text text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">예측은 조건과 결과를 함께 봅니다</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:leading-7">발언일 기준 종가·방향·목표·기간을 고정하고 평가일의 실제 성과를 같은 기간 시장지수와 비교합니다.</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          [Target, "목표를 그대로 기록", "수익률과 목표가격을 사후 변경 없이 보존"],
          [CalendarClock, "평가일을 먼저 고정", "예측기간이 끝난 시점에 같은 기준으로 평가"],
          [Scale, "시장과 나란히 비교", "절대 수익률과 시장 대비 성과를 분리"],
        ].map(([Icon, title, text]) => (
          <div key={String(title)} className="rounded-2xl border border-line bg-white p-4">
            <Icon aria-hidden="true" className="size-5 text-brand" />
            <p className="mt-3 text-sm font-extrabold text-ink">{String(title)}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{String(text)}</p>
          </div>
        ))}
      </div>

      {marketDataResult ? (
        <DemoNotice
          compact
          className="mb-6"
          title={marketDataResult.assessment.status === "completed"
            ? "실제 시장데이터 기반 평가"
            : marketDataResult.ok
              ? "실제 데이터와 데모 데이터 구분"
              : "시장데이터 조회 안내"}
          description={
            marketDataResult.assessment.status === "completed"
              ? "선택한 예측은 실제 일별 주가와 기준지수로 사후평가했습니다. 표시된 평가값은 실제 시장데이터 기반입니다."
              : marketDataResult.ok
                ? "선택한 예측의 발언일 종가와 기준지수는 실제 시장데이터입니다. 미래 예측은 평가 예정일까지 추적 중으로 유지합니다."
              : "선택한 예측은 실제 주가를 확인하지 못했으며 다른 종목의 데모 가격으로 대체하지 않습니다."
          }
        />
      ) : structuredPrediction ? (
        <DemoNotice
          compact
          className="mb-6"
          title="분석 결과 표시 안내"
          description="현재 분석에서 생성된 예측만 표시합니다. 실제 주가를 확인하지 못한 값은 데모 가격으로 대체하지 않습니다."
        />
      ) : (
        <DemoNotice compact className="mb-6" />
      )}

      <Suspense
        fallback={
          <div className="surface-card flex min-h-64 items-center justify-center">
            <div className="text-center">
              <LoaderCircle aria-hidden="true" className="mx-auto size-6 animate-spin text-brand" />
              <p className="mt-3 text-sm font-bold text-muted">예측 기록을 불러오는 중…</p>
            </div>
          </div>
        }
      >
        <PredictionExplorer marketDataResult={marketDataResult} />
      </Suspense>

      <section className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-6" aria-labelledby="method-title">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2f2] text-brand">
            <LineChart aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="method-title" className="text-base font-black text-ink">평가 방식</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {structuredPrediction
                ? "현재 분석 결과는 발언일과 평가일의 종가, 기간 중 고가·저가 및 같은 시장의 기준지수를 사용합니다. 배당·세금·거래비용은 반영하지 않습니다."
                : "실제 입력 평가는 발언일과 평가일의 종가, 기간 중 고가·저가 및 같은 시장의 기준지수를 사용합니다. 배당·세금·거래비용은 반영하지 않으며, 현재 예시 카드의 성과값은 데모 데이터입니다."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
