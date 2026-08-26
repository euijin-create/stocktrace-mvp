import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { AnalysisWorkspace } from "@/components/analysis-workspace";

export const metadata: Metadata = {
  title: "콘텐츠 분석",
  description: "주식 콘텐츠의 발언을 입력하고 StockTrace의 데모 분석 흐름을 체험해 보세요.",
};

function WorkspaceFallback() {
  return (
    <div className="surface-card flex min-h-80 items-center justify-center p-8 text-center">
      <div>
        <LoaderCircle aria-hidden="true" className="mx-auto size-6 animate-spin text-brand" />
        <p className="mt-3 text-sm font-bold text-muted">분석 화면을 준비하고 있어요.</p>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <nav aria-label="현재 위치" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/" className="rounded-md py-1 transition hover:text-ink">
          홈
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span aria-current="page" className="text-ink">콘텐츠 분석</span>
      </nav>

      <div className="mb-7 mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-brand">CONTENT ANALYSIS</p>
          <h1 className="mt-2 balance-text text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">
            발언을 기록 가능한 정보로 바꿔보세요
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
            원문에서 검증할 사실과 추적할 예측을 구분하고, 다음 확인 경로를 안내합니다.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
          <ShieldCheck aria-hidden="true" className="size-4" />
          입력값 외부 전송 없음
        </span>
      </div>

      <Suspense fallback={<WorkspaceFallback />}>
        <AnalysisWorkspace />
      </Suspense>
    </main>
  );
}
