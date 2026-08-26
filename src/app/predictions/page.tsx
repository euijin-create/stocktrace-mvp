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

export const metadata: Metadata = {
  title: "예측 추적",
  description: "발언 당시 조건과 이후 실제 수익률, 시장 대비 성과를 함께 추적합니다.",
};

export default function PredictionsPage() {
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
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted sm:text-base sm:leading-7">발언 당시의 가격·방향·목표·기간을 고정하고 평가일의 실제 성과를 같은 기간 시장지수와 비교합니다.</p>
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

      <DemoNotice compact className="mb-6" />

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
        <PredictionExplorer />
      </Suspense>

      <section className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-6" aria-labelledby="method-title">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2f2] text-brand">
            <LineChart aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="method-title" className="text-base font-black text-ink">평가 방식</h2>
            <p className="mt-2 text-sm leading-6 text-muted">현재 데모는 발언일 종가와 평가일 종가를 비교하며 배당·세금·거래비용을 반영하지 않습니다. 실제 서비스에서는 거래정지, 액면분할 등 가격 조정 기준도 함께 공개할 예정입니다.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
