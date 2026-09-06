import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock3,
  FileCheck2,
  Fingerprint,
  Info,
  LockKeyhole,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { AnalysisInputSummary } from "@/components/analysis-input-summary";
import { ReceiptCard } from "@/components/receipt-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { mockDatabase, receipts } from "@/data/mock-data";
import {
  appendAnalysisInput,
  readAnalysisInputFromRecord,
  type AnalysisSearchParams,
} from "@/lib/mock-analysis";
import {
  formatKoreanDateTime,
  getInfluencerById,
  getReceiptById,
  getStatementById,
} from "@/lib/stocktrace";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<AnalysisSearchParams>;
};

export function generateStaticParams() {
  return receipts.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const receipt = getReceiptById(id);
  return {
    title: receipt ? `${receipt.snapshot.influencerName} 발언 영수증` : "발언 영수증",
    description: receipt ? `“${receipt.snapshot.originalText}” 발언 기록` : "StockTrace 발언 기록",
  };
}

export default async function ReceiptPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const receipt = getReceiptById(id);
  if (!receipt) notFound();

  const analysisInput = readAnalysisInputFromRecord(query);
  const preserveAnalysisInput = (href: string) =>
    analysisInput ? appendAnalysisInput(href, analysisInput) : href;
  const statement = getStatementById(receipt.statementId);
  const influencer = statement ? getInfluencerById(statement.influencerId) : undefined;
  const factCheck = mockDatabase.factChecks.find((item) => item.statementId === receipt.statementId);
  const prediction = mockDatabase.predictions.find((item) => item.statementId === receipt.statementId);

  const formattedReceipt = {
    ...receipt,
    recordedAt: formatKoreanDateTime(receipt.recordedAt),
    snapshot: {
      ...receipt.snapshot,
      influencerName: analysisInput?.influencerName ?? receipt.snapshot.influencerName,
      originalText: analysisInput?.statement ?? receipt.snapshot.originalText,
      contentUrl: analysisInput?.contentUrl ?? receipt.snapshot.contentUrl,
      publishedAt: formatKoreanDateTime(receipt.snapshot.publishedAt),
      priceAtStatement: receipt.snapshot.priceAtStatement
        ? {
            ...receipt.snapshot.priceAtStatement,
            capturedAt: formatKoreanDateTime(receipt.snapshot.priceAtStatement.capturedAt),
          }
        : undefined,
    },
    history: receipt.history.map((event) => ({
      ...event,
      observedAt: formatKoreanDateTime(event.observedAt),
    })),
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/" className="rounded-md py-1 hover:text-ink">홈</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link href="/analyze" className="rounded-md py-1 hover:text-ink">콘텐츠 분석</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span aria-current="page" className="text-ink">발언 영수증</span>
      </nav>

      <div className="mb-7 mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-brand">STATEMENT RECEIPT</p>
          <h1 className="mt-2 balance-text text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">발언 당시의 정보를 한 장에</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">원문, 게시 시점, 종목과 발언일 기준 종가를 기록해 이후의 검증·평가와 연결합니다.</p>
        </div>
        <Link prefetch={false} href={preserveAnalysisInput(factCheck ? `/fact-checks/${factCheck.id}` : "/analyze")} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-extrabold text-ink hover:bg-slate-50">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {factCheck ? "팩트체크로 돌아가기" : "분석으로 돌아가기"}
        </Link>
      </div>

      <DemoNotice compact className="mb-6" />
      {analysisInput && <AnalysisInputSummary input={analysisInput} className="mb-6" />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
        <ReceiptCard receipt={formattedReceipt} />

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="surface-card p-5" aria-labelledby="integrity-title">
            <div className="flex items-center gap-2">
              <Fingerprint aria-hidden="true" className="size-5 text-brand" />
              <h2 id="integrity-title" className="text-sm font-black text-ink">기록 무결성 미리보기</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted"><LockKeyhole aria-hidden="true" className="size-3.5" /> 해시 미리보기</p>
                <p className="mt-1.5 break-all font-mono text-xs font-bold text-ink">{receipt.integrity?.hashPreview ?? "MVP 미적용"}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted"><Clock3 aria-hidden="true" className="size-3.5" /> 타임스탬프</p>
                <p className="mt-1.5 text-xs font-bold text-ink">{receipt.integrity?.timestampLabel ?? "MVP 미적용"}</p>
              </div>
            </div>
            <p className="mt-4 flex gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              현재 해시와 타임스탬프는 UI 예시이며 실제 무결성 검증 기능은 연결되지 않았습니다.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5" aria-labelledby="connected-title">
            <h2 id="connected-title" className="text-sm font-black text-ink">연결된 기록</h2>
            <div className="mt-3 space-y-2">
              {factCheck && (
                <Link prefetch={false} href={preserveAnalysisInput(`/fact-checks/${factCheck.id}`)} className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 text-sm font-bold text-ink hover:bg-[#edf5f5]">
                  <span className="flex items-center gap-2"><FileCheck2 aria-hidden="true" className="size-4 text-brand" /> 팩트체크 결과</span>
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              )}
              {prediction && (
                <Link href={preserveAnalysisInput(`/predictions/${prediction.id}`)} className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 text-sm font-bold text-ink hover:bg-[#edf5f5]">
                  <span className="flex items-center gap-2"><ReceiptText aria-hidden="true" className="size-4 text-brand" /> 예측 추적 결과</span>
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              )}
              {influencer && (
                <Link href={`/influencers/${influencer.slug}`} className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 text-sm font-bold text-ink hover:bg-[#edf5f5]">
                  <span className="flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 text-brand" /> {influencer.displayName} 프로필</span>
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              )}
            </div>
          </section>

          <div className="rounded-2xl border border-slate-200 bg-slate-100/70 p-4 text-xs leading-5 text-slate-600">
            <strong className="block text-ink">변경 이력의 의미</strong>
            <p className="mt-1.5">콘텐츠의 수정·비공개·접근 불가는 관찰된 상태만 기록합니다. 그 사실만으로 의도나 부정행위를 추론하지 않습니다.</p>
          </div>
        </aside>
      </div>

      <div className="mt-6 flex justify-end">
        <Link href="/predictions" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white hover:bg-[#1c4053]">
          예측 추적 살펴보기 <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </main>
  );
}
