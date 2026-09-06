import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Building2,
  CalendarCheck2,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  FileText,
  Quote,
  ScanSearch,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AiStatementClassification } from "@/components/ai-statement-classification";
import { ConfidenceMeter } from "@/components/confidence-meter";
import { ComparisonList, EvidenceCard } from "@/components/evidence-card";
import { AnalysisInputSummary } from "@/components/analysis-input-summary";
import { FactCheckCorrectionRequest } from "@/components/fact-check-correction-request";
import { OpenDartDisclosures } from "@/components/open-dart-disclosures";
import { OpenDartVerificationDetails } from "@/components/open-dart-verification";
import { ReceiptCard } from "@/components/receipt-card";
import { DemoNotice } from "@/components/ui/demo-notice";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { factChecks } from "@/data/mock-data";
import {
  appendAnalysisInput,
  readAnalysisInputFromRecord,
  type AnalysisSearchParams,
} from "@/lib/mock-analysis";
import { lookupOpenDartDisclosures } from "@/lib/dart/open-dart";
import { verifyOpenDartClaim } from "@/lib/fact-check/verify-open-dart-claim";
import type { OpenDartVerificationStatus } from "@/lib/fact-check/types";
import {
  CLAIM_TYPE_META,
  COMPARISON_RESULT_META,
  VERIFICATION_STATUS_META,
  formatKoreanDate,
  formatKoreanDateTime,
  getFactCheckView,
  getHomeFactChecks,
  resolveInfluencerProfileHref,
  type SemanticTone,
} from "@/lib/stocktrace";
import {
  VERIFICATION_STATUS,
  type OfficialSourceCategory,
  type VerificationStatus,
} from "@/types/stocktrace";

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

const actualVerificationStatusMap: Record<
  OpenDartVerificationStatus,
  VerificationStatus
> = {
  confirmed: VERIFICATION_STATUS.CONFIRMED,
  partially_confirmed: VERIFICATION_STATUS.PARTIALLY_CONFIRMED,
  exaggeration_or_context_missing: VERIFICATION_STATUS.CONTEXT_MAY_BE_MISSING,
  no_official_evidence: VERIFICATION_STATUS.NO_OFFICIAL_EVIDENCE,
  conflicts_with_official_source: VERIFICATION_STATUS.CONFLICTS_OFFICIAL,
  not_currently_verifiable: VERIFICATION_STATUS.CURRENTLY_UNVERIFIABLE,
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
  const structuredFact =
    analysisInput?.structuredAnalysis?.statementType === "fact_claim"
      ? analysisInput.structuredAnalysis
      : null;
  const openDartResult = structuredFact
    ? await lookupOpenDartDisclosures({
        companyNames: [structuredFact.stockName, structuredFact.company],
        limit: 40,
      })
    : null;
  const actualFactCheck =
    analysisInput?.analysisMode === "ai" && structuredFact && openDartResult
      ? await verifyOpenDartClaim({
          lookup: openDartResult,
          statement: analysisInput.statement,
        })
      : null;
  const liveVerification =
    actualFactCheck?.status === "success" ? actualFactCheck.result : null;
  const isLiveVerification = liveVerification !== null;
  const displayedOpenDartResult = openDartResult
    ? {
        ...openDartResult,
        disclosures:
          actualFactCheck && actualFactCheck.candidateDisclosures.length > 0
            ? actualFactCheck.candidateDisclosures
            : openDartResult.disclosures.slice(0, 6),
      }
    : null;
  const dataSeparationDescription =
    analysisInput?.analysisMode === "ai"
      ? isLiveVerification
        ? "Gemini의 발언 분류와 OpenDART 공시 원문 기반 비교는 실제 분석입니다. 발언 영수증에 표시되는 일부 기록은 데모 데이터입니다."
        : `Gemini의 발언 분류는 실제 AI 분석입니다. ${actualFactCheck?.message ?? "6단계 검증 결과와 공시 내용 비교는 아직 데모 데이터입니다."} 아래 데모 판정은 실제 OpenDART 검증 결과가 아닙니다.`
      : undefined;
  const displayedStatement = analysisInput?.statement ?? statement.text;
  const displayedInfluencer = analysisInput?.influencerName ?? influencer.displayName;
  const displayedCompany =
    analysisInput?.structuredAnalysis?.stockName ??
    analysisInput?.structuredAnalysis?.company ??
    factCheck.companyOrStockLabel;
  const influencerProfileHref = resolveInfluencerProfileHref(
    analysisInput?.influencerName,
    influencer.slug,
  );
  const preserveAnalysisInput = (href: string) =>
    analysisInput ? appendAnalysisInput(href, analysisInput) : href;
  const displayedVerificationStatus = liveVerification
    ? actualVerificationStatusMap[liveVerification.verificationStatus]
    : factCheck.status;
  const verificationMeta = VERIFICATION_STATUS_META[displayedVerificationStatus];
  const displayedSummary = liveVerification?.summary ?? factCheck.summary;
  const displayedConfidence = liveVerification?.confidence ?? factCheck.confidence.score;
  const displayedCheckedAt = liveVerification?.verifiedAt ?? factCheck.checkedAt;
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
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={toneMap[verificationMeta.tone]} className="min-h-9 px-3 text-sm">
              {verificationMeta.label}
            </StatusBadge>
            <StatusBadge tone={isLiveVerification ? "info" : "neutral"}>
              {isLiveVerification ? "OpenDART 실제 공시 기반 검증" : "데모 팩트체크"}
            </StatusBadge>
          </div>
        </div>
      </div>

      <section className="surface-card overflow-hidden" aria-labelledby="verdict-title">
        <div className="border-b border-line bg-[#f8fbfa] px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e6f2ef] text-emerald-700">
              <ShieldCheck aria-hidden="true" className="size-5.5" />
            </span>
            <div>
              <p className="text-xs font-bold text-emerald-700">
                {isLiveVerification ? "OpenDART 공식자료 검증" : "팩트체크 검증 결과"}
              </p>
              <h2 id="verdict-title" className="mt-1 text-2xl font-black tracking-[-0.03em] text-ink">
                {verificationMeta.label}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted">{verificationMeta.description}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-2xl border-l-4 border-brand bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted">
                <Quote aria-hidden="true" className="size-3.5" /> 원문 핵심 발언
              </div>
              <blockquote className="mt-2 break-words text-base font-extrabold leading-7 text-ink sm:text-lg sm:leading-8">
                “{displayedStatement}”
              </blockquote>
              {analysisInput?.structuredAnalysis ? (
                <AiStatementClassification
                  className="mt-4"
                  compact
                  mode={analysisInput.analysisMode}
                  statementType={analysisInput.structuredAnalysis.statementType}
                />
              ) : null}
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <p className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Building2 aria-hidden="true" className="size-3.5 text-brand" />
                기업 또는 종목
              </p>
              <p className="mt-2 text-lg font-black tracking-[-0.02em] text-ink">
                {displayedCompany}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">이 발언에서 공식자료와 비교한 대상입니다.</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#102f3e] p-5 text-white">
            <p className="text-xs font-bold text-cyan-200">StockTrace 판단 요약</p>
            <p className="mt-2 text-[15px] font-semibold leading-7">{displayedSummary}</p>
          </div>

          <ConfidenceMeter
            className="mt-5"
            score={displayedConfidence}
            level={liveVerification ? undefined : factCheck.confidence.level}
            label={liveVerification ? "공시 근거 비교 신뢰수준" : undefined}
            rationale={
              liveVerification
                ? "제공된 OpenDART 실제 공시 발췌문과 사용자 발언을 비교한 AI의 구조화 확신도입니다."
                : factCheck.confidence.rationale
            }
          />
        </div>
      </section>

      <DemoNotice
        className="mt-4"
        compact
        title={
          isLiveVerification
            ? "실제 검증과 데모 데이터 구분"
            : analysisInput?.analysisMode === "ai"
              ? "AI 분류와 데모 검증 구분"
              : "데모 데이터 안내"
        }
        description={dataSeparationDescription}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-4">
          <FactCheckDetail
            title="검증 요약"
            description="발언 분류, 인플루언서와 검증 시점을 확인합니다."
          >
            {analysisInput && <AnalysisInputSummary input={analysisInput} className="mb-5" />}
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><UserRound aria-hidden="true" className="size-3.5" /> 인플루언서</dt>
                <dd className="mt-1.5">
                  <Link href={influencerProfileHref} className="inline-flex min-h-7 items-center gap-1 text-sm font-extrabold text-ink hover:text-action">
                    {displayedInfluencer}<ChevronRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </dd>
              </div>
              <div className="rounded-xl border border-line p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><ScanSearch aria-hidden="true" className="size-3.5" /> 발언 유형</dt>
                <dd className="mt-1.5 text-sm font-extrabold leading-5 text-ink">{claimMeta.label}</dd>
              </div>
              <div className="rounded-xl border border-line p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold text-muted"><CalendarCheck2 aria-hidden="true" className="size-3.5" /> 검증일</dt>
                <dd className="mt-1.5 text-sm font-extrabold text-ink">{formatKoreanDate(displayedCheckedAt)}</dd>
              </div>
            </dl>
          </FactCheckDetail>

          <FactCheckDetail
            title="근거자료"
            description={
              displayedOpenDartResult
                ? isLiveVerification
                  ? `OpenDART 실제 원문 비교 ${liveVerification.matchedFacts.length + liveVerification.conflictingFacts.length + liveVerification.unverifiedFacts.length}개 항목 · 실제 공시 ${liveVerification.sources.length}건`
                  : `OpenDART 공시 조회 · 데모 비교 ${factCheck.comparisons.length}개 항목 · 데모 자료 ${sources.length}건`
                : `데모 비교 ${factCheck.comparisons.length}개 항목 · 데모 자료 ${sources.length}건`
            }
          >
            {displayedOpenDartResult ? (
              <div className="mb-7">
                <OpenDartDisclosures result={displayedOpenDartResult} />
              </div>
            ) : null}

            {liveVerification ? (
              <OpenDartVerificationDetails result={liveVerification} />
            ) : (
              <>
            <section aria-labelledby="comparison-title">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.12em] text-brand">DEMO CLAIM VS SOURCE</p>
                  <h2 id="comparison-title" className="mt-1.5 text-lg font-black tracking-[-0.025em] text-ink">발언과 공식자료 비교</h2>
                </div>
                <StatusBadge tone="neutral">데모 판정</StatusBadge>
              </div>
              <ComparisonList
                items={factCheck.comparisons.map((comparison) => ({
                  ...comparison,
                  resultLabel: COMPARISON_RESULT_META[comparison.result].label,
                }))}
              />
            </section>

            <section className="mt-7" aria-labelledby="sources-title">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-extrabold tracking-[0.12em] text-brand">DEMO SOURCES</p>
                  <h2 id="sources-title" className="mt-1.5 text-lg font-black tracking-[-0.025em] text-ink">검증에 사용된 예시 자료</h2>
                </div>
                <StatusBadge tone="neutral">데모 공시 데이터</StatusBadge>
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
                    sourceUrl={source.url}
                  />
                ))}
              </div>
            </section>
              </>
            )}
          </FactCheckDetail>

          {formattedReceipt && (
            <FactCheckDetail
              id="statement-receipt"
              title="발언 기록"
              description="발언 영수증과 콘텐츠 변경 이력을 확인합니다."
            >
              <div className="mb-4 flex justify-end">
                <Link href={preserveAnalysisInput(`/receipts/${formattedReceipt.id}`)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-extrabold text-action hover:bg-blue-50">
                  영수증 단독 화면 <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
              <ReceiptCard receipt={formattedReceipt} />
            </FactCheckDetail>
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
              <Link href={influencerProfileHref} className="flex min-h-11 items-center justify-between rounded-xl bg-slate-50 px-3 text-sm font-bold text-ink hover:bg-[#edf5f5]">
                <span className="flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 text-brand" /> 프로필 보기</span>
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>

          <FactCheckCorrectionRequest />

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
            <strong className="block font-extrabold">해석 시 참고</strong>
            <p className="mt-1.5">공식 근거를 찾지 못한 결과는 곧바로 발언이 거짓이라는 뜻이 아닙니다. 확인 범위와 자료 시점을 함께 살펴보세요.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}

function FactCheckDetail({
  children,
  description,
  id,
  title,
}: {
  children: ReactNode;
  description: string;
  id?: string;
  title: string;
}) {
  return (
    <details id={id} className="group surface-card scroll-mt-24 overflow-hidden">
      <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden hover:bg-slate-50/70 [&::-webkit-details-marker]:hidden sm:px-6">
        <span className="min-w-0">
          <span className="block text-base font-black tracking-[-0.02em] text-ink">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-muted sm:text-sm">{description}</span>
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-white text-muted transition group-open:rotate-180 group-open:text-brand">
          <ChevronDown aria-hidden="true" className="size-4" />
        </span>
      </summary>
      <div className="border-t border-line bg-white p-5 sm:p-6">{children}</div>
    </details>
  );
}
