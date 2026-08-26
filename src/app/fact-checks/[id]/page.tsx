import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  ChevronRight,
  FileCheck2,
  FileText,
  Quote,
  ScanSearch,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ConfidenceMeter } from "@/components/confidence-meter";
import { ComparisonList, EvidenceCard } from "@/components/evidence-card";
import { AnalysisInputSummary } from "@/components/analysis-input-summary";
import { ReceiptCard } from "@/components/receipt-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { factChecks } from "@/data/mock-data";
import {
  appendAnalysisInput,
  readAnalysisInputFromRecord,
  type AnalysisSearchParams,
} from "@/lib/mock-analysis";
import {
  CLAIM_TYPE_META,
  COMPARISON_RESULT_META,
  VERIFICATION_STATUS_META,
  formatKoreanDate,
  formatKoreanDateTime,
  getFactCheckView,
  getHomeFactChecks,
  type SemanticTone,
} from "@/lib/stocktrace";
import type { OfficialSourceCategory } from "@/types/stocktrace";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<AnalysisSearchParams>;
};

const toneMap: Record<SemanticTone, StatusTone> = {
  positive: "success",
  information: "info",
  caution: "warning",
  negative: "danger",
  neutral: "neutral",
};

const sourceCategoryLabel: Record<OfficialSourceCategory, string> = {
  dart: "DART 공시",
  kind: "KIND 공시",
  krx: "KRX 자료",
  company: "기업 공식자료",
  government: "정부기관 자료",
};

export function generateStaticParams() {
  return factChecks.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const view = getFactCheckView(id);
  return {
    title: view ? `${view.influencer.displayName} 팩트체크` : "팩트체크 결과",
    description: view?.factCheck.summary ?? "StockTrace 팩트체크 예시 결과",
  };
}

export default async function FactCheckPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const view = getFactCheckView(id);
  if (!view) notFound();

  const { factCheck, statement, influencer, sources, receipt } = view;
  const analysisInput = readAnalysisInputFromRecord(query);
  const displayedStatement = analysisInput?.statement ?? statement.text;
  const displayedInfluencer = analysisInput?.influencerName ?? influencer.displayName;
  const preserveAnalysisInput = (href: string) =>
    analysisInput ? appendAnalysisInput(href, analysisInput) : href;
  const verificationMeta = VERIFICATION_STATUS_META[factCheck.status];
  const claimMeta = CLAIM_TYPE_META[statement.primaryType];
  const allExamples = getHomeFactChecks();

  const formattedReceipt = receipt
    ? {
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
      }
    : undefined;

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/" className="rounded-md py-1 hover:text-ink">홈</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link href="/analyze" className="rounded-md py-1 hover:text-ink">콘텐츠 분석</Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span aria-current="page" className="text-ink">팩트체크 결과</span>
      </nav>

      <div className="mb-7 mt-5">
        <p className="text-sm font-extrabold text-brand">FACT CHECK REPORT</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="balance-text text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl">팩트체크 결과</h1>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">발언과 확인한 공식자료의 일치 범위를 항목별로 보여드립니다.</p>
          </div>
          <StatusBadge tone={toneMap[verificationMeta.tone]} className="min-h-9 px-3 text-sm">
            {verificationMeta.label}
          </StatusBadge>
        </div>
      </div>

      <DemoNotice className="mb-6" compact />
      {analysisInput && <AnalysisInputSummary input={analysisInput} className="mb-6" />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-6">
          <section className="surface-card overflow-hidden" aria-labelledby="verdict-title">
            <div className="border-b border-line bg-[#f8fbfa] px-5 py-5 sm:px-7">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e6f2ef] text-emerald-700">
                  <ShieldCheck aria-hidden="true" className="size-5.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-700">검증 판단</p>
                  <h2 id="verdict-title" className="mt-1 text-xl font-black tracking-[-0.02em] text-ink">
                    {verificationMeta.label}
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{verificationMeta.description}</p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="rounded-2xl border-l-4 border-brand bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2 text-xs font-bold text-muted">
                  <Quote aria-hidden="true" className="size-3.5" /> 원문 발언
                </div>
                <blockquote className="mt-2 break-words text-base font-extrabold leading-7 text-ink sm:text-lg sm:leading-8">
                  “{displayedStatement}”
                </blockquote>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line p-4">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><UserRound aria-hidden="true" className="size-3.5" /> 인플루언서</dt>
                  <dd className="mt-1.5">
                    {analysisInput ? (
                      <span className="text-sm font-extrabold text-ink">{displayedInfluencer}</span>
                    ) : (
                      <Link href={view.influencerHref} className="inline-flex min-h-7 items-center gap-1 text-sm font-extrabold text-ink hover:text-action">
                        {displayedInfluencer}<ChevronRight aria-hidden="true" className="size-3.5" />
                      </Link>
                    )}
                  </dd>
                </div>
                <div className="rounded-xl border border-line p-4">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><Building2 aria-hidden="true" className="size-3.5" /> 언급 기업·종목</dt>
                  <dd className="mt-1.5 text-sm font-extrabold text-ink">{factCheck.companyOrStockLabel}</dd>
                </div>
                <div className="rounded-xl border border-line p-4">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><ScanSearch aria-hidden="true" className="size-3.5" /> 발언 유형</dt>
                  <dd className="mt-1.5 text-sm font-extrabold leading-5 text-ink">{claimMeta.label}</dd>
                </div>
                <div className="rounded-xl border border-line p-4">
                  <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><CalendarCheck2 aria-hidden="true" className="size-3.5" /> 검증일</dt>
                  <dd className="mt-1.5 text-sm font-extrabold text-ink">{formatKoreanDate(factCheck.checkedAt)}</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-2xl bg-[#102f3e] p-5 text-white">
                <p className="text-xs font-bold text-cyan-200">StockTrace 판단 요약</p>
                <p className="mt-2 text-[15px] font-semibold leading-7">{factCheck.summary}</p>
              </div>

              <ConfidenceMeter
                className="mt-5"
                score={factCheck.confidence.score}
                level={factCheck.confidence.level}
                rationale={factCheck.confidence.rationale}
              />
            </div>
          </section>

          <section aria-labelledby="comparison-title">
            <div className="mb-4">
              <p className="text-xs font-extrabold tracking-[0.12em] text-brand">CLAIM VS SOURCE</p>
              <h2 id="comparison-title" className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink">발언과 공식자료 비교</h2>
            </div>
            <ComparisonList
              items={factCheck.comparisons.map((comparison) => ({
                ...comparison,
                resultLabel: COMPARISON_RESULT_META[comparison.result].label,
              }))}
            />
          </section>

          <section aria-labelledby="sources-title">
            <div className="mb-4">
              <p className="text-xs font-extrabold tracking-[0.12em] text-brand">OFFICIAL SOURCES</p>
              <h2 id="sources-title" className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink">검증에 사용된 공식자료</h2>
            </div>
            <div className="space-y-3">
              {sources.map((source) => (
                <EvidenceCard
                  key={source.id}
                  organization={source.organization}
                  title={source.title}
                  category={sourceCategoryLabel[source.category]}
                  documentDate={formatKoreanDate(source.documentDate)}
                  referenceNo={source.referenceNo}
                  keyPoint={source.keyPoint}
                />
              ))}
            </div>
          </section>

          {formattedReceipt && (
            <section id="statement-receipt" className="scroll-mt-24" aria-labelledby="receipt-section-title">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.12em] text-brand">STATEMENT RECEIPT</p>
                  <h2 id="receipt-section-title" className="mt-1.5 text-xl font-black tracking-[-0.025em] text-ink">발언 기록</h2>
                </div>
                <Link href={preserveAnalysisInput(`/receipts/${formattedReceipt.id}`)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-extrabold text-action hover:bg-blue-50">
                  영수증 단독 화면 <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
              <ReceiptCard receipt={formattedReceipt} />
            </section>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="surface-card p-5">
            <div className="flex items-center gap-2">
              <FileCheck2 aria-hidden="true" className="size-4.5 text-brand" />
              <h2 className="text-sm font-black text-ink">6단계 검증 예시</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">각 상태는 결론의 강도와 확인 범위를 함께 설명합니다.</p>
            <div className="mt-4 space-y-2">
              {allExamples.map((example) => {
                const meta = VERIFICATION_STATUS_META[example.factCheck.status];
                const current = example.factCheck.id === factCheck.id;
                return (
                  <Link
                    key={example.factCheck.id}
                    href={example.href}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 transition ${current ? "border-brand bg-[#e9f3f3]" : "border-transparent bg-slate-50 hover:border-line hover:bg-white"}`}
                  >
                    <span className="min-w-0 text-xs font-bold leading-4 text-ink">{meta.label}</span>
                    <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="text-sm font-black text-ink">이 기록의 다음 단계</h2>
            <div className="mt-3 space-y-2">
              {receipt && (
                <Link href={preserveAnalysisInput(`/receipts/${receipt.id}`)} className="flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-bold text-ink hover:bg-[#edf5f5]">
                  <span className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4 text-brand" /> 발언 영수증</span>
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Link>
              )}
              <Link href="/predictions" className="flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-bold text-ink hover:bg-[#edf5f5]">
                <span className="flex items-center gap-2"><ArrowRight aria-hidden="true" className="size-4 text-brand" /> 예측 추적 보기</span>
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
              <Link href={view.influencerHref} className="flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-bold text-ink hover:bg-[#edf5f5]">
                <span className="flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 text-brand" /> 프로필 보기</span>
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            <strong className="block font-extrabold">해석 시 참고</strong>
            <p className="mt-1.5">공식 근거를 찾지 못한 결과는 곧바로 발언이 거짓이라는 뜻이 아닙니다. 확인 범위와 자료 시점을 함께 살펴보세요.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
