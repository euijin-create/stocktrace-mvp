"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronRight,
  FileCheck2,
  FileText,
  Info,
  Link2,
  LoaderCircle,
  MessageSquareText,
  ScanSearch,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AnalysisInputSummary } from "@/components/analysis-input-summary";
import { demoScenarios } from "@/data/mock-data";
import {
  analyzeContentWithMock,
  analyzeStatementsWithMock,
  appendAnalysisInput,
  readAnalysisInput,
  type ContentAnalysisInput,
  type MockAnalyzedStatement,
} from "@/lib/mock-analysis";
import { CLAIM_TYPE_META } from "@/lib/stocktrace";

export function AnalysisWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restoredInput = useMemo(
    () => readAnalysisInput((key) => searchParams.get(key)),
    [searchParams],
  );
  const initialUrl = restoredInput?.contentUrl ?? searchParams.get("url") ?? "";
  const [url, setUrl] = useState(initialUrl);
  const [influencer, setInfluencer] = useState(restoredInput?.influencerName ?? "");
  const [statement, setStatement] = useState(restoredInput?.statement ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MockAnalyzedStatement[]>(() => {
    if (!restoredInput) return [];
    const restoredResults = analyzeStatementsWithMock(restoredInput.statement);
    return restoredResults.length > 1 || restoredResults[0]?.analysis.kind === "opinion"
      ? restoredResults
      : [];
  });
  const [analyzedInput, setAnalyzedInput] = useState<ContentAnalysisInput | null>(() => {
    if (!restoredInput) return null;
    const restoredResults = analyzeStatementsWithMock(restoredInput.statement);
    return restoredResults.length > 1 || restoredResults[0]?.analysis.kind === "opinion"
      ? restoredInput
      : null;
  });
  const submittedInput = useMemo<ContentAnalysisInput>(
    () => ({
      contentUrl: url.trim(),
      influencerName: influencer.trim(),
      statement: statement.trim(),
    }),
    [influencer, statement, url],
  );
  const result = results.length === 1 ? results[0].analysis : null;
  const resultInput = analyzedInput ?? submittedInput;

  function applySample(index: number) {
    const sample = demoScenarios[index];
    setUrl(sample.input.contentUrl);
    setInfluencer(sample.input.influencerName);
    setStatement(sample.input.statement);
    setError("");
    setResults([]);
    setAnalyzedInput(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || !influencer.trim() || !statement.trim()) {
      setError("콘텐츠 URL, 인플루언서 이름, 분석할 발언을 모두 입력해 주세요.");
      return;
    }
    try {
      const parsed = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("invalid protocol");
    } catch {
      setError("콘텐츠 URL은 http:// 또는 https://로 시작해야 합니다.");
      return;
    }

    setError("");
    setLoading(true);
    setResults([]);
    setAnalyzedInput(null);
    await new Promise((resolve) => window.setTimeout(resolve, 650));

    try {
      const analysis = await analyzeContentWithMock(submittedInput);
      const extractedStatements = analysis.statements;
      const onlyStatement = extractedStatements.length === 1 ? extractedStatements[0] : null;

      if (onlyStatement?.analysis.destinationHref) {
        const selectedInput = { ...submittedInput, statement: onlyStatement.statement };
        router.push(
          appendAnalysisInput(onlyStatement.analysis.destinationHref, selectedInput),
        );
        return;
      }

      setResults(extractedStatements);
      setAnalyzedInput(submittedInput);
      setLoading(false);
      router.replace(appendAnalysisInput("/analyze", submittedInput), { scroll: false });
      window.requestAnimationFrame(() => {
        document.getElementById("analysis-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      setLoading(false);
      setError("데모 분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,.78fr)] lg:items-start">
      <section className="surface-card overflow-hidden" aria-labelledby="analysis-form-title">
        <div className="border-b border-line bg-[#f9fbfb] px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f2f2] text-brand">
              <ScanSearch aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 id="analysis-form-title" className="text-lg font-black tracking-[-0.02em] text-ink">
                분석할 내용을 알려주세요
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">입력한 발언은 저장되거나 외부로 전송되지 않습니다.</p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} noValidate className="space-y-5 p-5 sm:p-7">
          <div>
            <label htmlFor="content-url" className="mb-2 block text-sm font-bold text-ink">
              콘텐츠 URL <span className="text-action">*</span>
            </label>
            <div className="flex min-h-13 items-center gap-3 rounded-xl border border-line bg-white px-4 transition focus-within:border-action focus-within:ring-3 focus-within:ring-blue-100">
              <Link2 aria-hidden="true" className="size-4.5 shrink-0 text-slate-400" />
              <input
                id="content-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="influencer" className="mb-2 block text-sm font-bold text-ink">
              인플루언서 이름 <span className="text-action">*</span>
            </label>
            <div className="flex min-h-13 items-center gap-3 rounded-xl border border-line bg-white px-4 transition focus-within:border-action focus-within:ring-3 focus-within:ring-blue-100">
              <UserRound aria-hidden="true" className="size-4.5 shrink-0 text-slate-400" />
              <input
                id="influencer"
                type="text"
                autoComplete="off"
                value={influencer}
                onChange={(event) => setInfluencer(event.target.value)}
                placeholder="예: 주식왕"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="statement" className="text-sm font-bold text-ink">
                분석할 발언 <span className="text-action">*</span>
              </label>
              <span className="text-xs text-slate-400">{statement.length}/500</span>
            </div>
            <textarea
              id="statement"
              rows={5}
              maxLength={500}
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              placeholder={'예: “에이원테크는 한 달 안에 20% 상승할 것이다.”'}
              className="w-full resize-y rounded-xl border border-line bg-white px-4 py-3.5 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-action focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#1c4053] disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? (
              <>
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                발언 구조를 살펴보는 중…
              </>
            ) : (
              <>
                <Sparkles aria-hidden="true" className="size-4" />
                가상 AI 분석하기
              </>
            )}
          </button>
        </form>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-24">
        <div className="surface-card p-5 sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand">빠른 체험</p>
          <h2 className="mt-2 text-lg font-black tracking-[-0.02em] text-ink">예시 발언으로 시작해 보세요</h2>
          <div className="mt-4 space-y-2.5">
            {demoScenarios.map((sample, index) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => applySample(index)}
                className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left transition hover:border-[#9db8c0] hover:bg-[#f7fbfb]"
              >
                <span>
                  <span className="block text-sm font-bold text-ink">{sample.label}</span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-muted">{sample.input.statement}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
          <details className="mt-4 border-t border-line pt-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-extrabold text-ink">
              분류하는 발언 유형 5가지
              <ChevronRight aria-hidden="true" className="size-4 text-slate-400" />
            </summary>
            <ul className="mt-2 space-y-2 pb-1">
              {Object.values(CLAIM_TYPE_META).map((meta) => (
                <li key={meta.label} className="flex items-start gap-2 text-xs leading-5 text-muted">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  <span><strong className="font-bold text-ink">{meta.label}</strong><br />{meta.description}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-3">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-action" />
            <div>
              <h2 className="text-sm font-extrabold text-ink">현재는 키워드 기반 데모입니다</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-600">
                실제 AI나 콘텐츠 수집 API는 연결하지 않았습니다. 입력값은 화면 흐름을 보여주는 분류 미리보기에만 반영됩니다.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div id="analysis-result" aria-live="polite" className="scroll-mt-28 lg:col-span-2">
        {loading && (
          <div className="surface-card flex min-h-52 items-center justify-center p-8 text-center">
            <div>
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#e8f2f2] text-brand">
                <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
              </span>
              <p className="mt-4 font-extrabold text-ink">발언에서 검증 가능한 단서를 찾고 있어요</p>
              <p className="mt-1.5 text-sm text-muted">종목 · 수치 · 기간 · 출처 표현을 분리합니다.</p>
            </div>
          </div>
        )}

        {results.length > 1 && !loading && (
          <section className="surface-card animate-enter overflow-hidden" aria-labelledby="multi-result-title">
            <div className="flex flex-col gap-4 border-b border-line bg-[#f8fbfa] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Check aria-hidden="true" className="size-5" strokeWidth={2.6} />
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-700">데모 분석 완료</p>
                  <h2 id="multi-result-title" className="mt-0.5 text-xl font-black tracking-[-0.02em] text-ink">
                    추출된 핵심 발언 {results.length}개
                  </h2>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <Sparkles aria-hidden="true" className="size-3.5" />
                문장 단위 mock 분석
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <AnalysisInputSummary input={resultInput} />

              <ol className="mt-5 space-y-4">
                {results.map(({ id, statement: extractedStatement, analysis }, index) => {
                  const selectedInput = { ...resultInput, statement: extractedStatement };
                  const isFact = analysis.kind === "fact";
                  const isPrediction =
                    analysis.kind === "prediction" || analysis.kind === "insufficient_prediction";

                  return (
                    <li key={id} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold text-muted">핵심 발언 {index + 1}</span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9dddd] bg-[#f1f8f7] px-2.5 py-1 text-xs font-bold text-brand">
                            {isFact ? (
                              <FileCheck2 aria-hidden="true" className="size-3.5" />
                            ) : isPrediction ? (
                              <BarChart3 aria-hidden="true" className="size-3.5" />
                            ) : (
                              <MessageSquareText aria-hidden="true" className="size-3.5" />
                            )}
                            {analysis.label}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-muted">
                          분류 신뢰수준 {analysis.confidence}%
                        </span>
                      </div>

                      <blockquote className="mt-4 text-base font-extrabold leading-7 tracking-[-0.01em] text-ink">
                        “{extractedStatement}”
                      </blockquote>

                      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                        {[
                          ["발언 유형", analysis.label],
                          ["언급 종목", analysis.detectedEntity],
                          ["기록 판단", analysis.conditionLabel],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl bg-slate-50 px-3.5 py-3">
                            <p className="text-[11px] font-semibold text-muted">{label}</p>
                            <p className="mt-1 text-sm font-extrabold leading-5 text-ink">{value}</p>
                          </div>
                        ))}
                      </div>

                      {analysis.predictionDetails && (
                        <dl className="mt-3 grid gap-2.5 sm:grid-cols-3">
                          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3">
                            <dt className="text-[11px] font-semibold text-slate-600">방향</dt>
                            <dd className="mt-1 text-sm font-extrabold text-ink">
                              {analysis.predictionDetails.directionLabel}
                            </dd>
                          </div>
                          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3">
                            <dt className="text-[11px] font-semibold text-slate-600">목표 수익률</dt>
                            <dd className="mt-1 text-sm font-extrabold text-ink">
                              {analysis.predictionDetails.targetReturnLabel ?? "조건 없음"}
                            </dd>
                          </div>
                          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3">
                            <dt className="text-[11px] font-semibold text-slate-600">기간</dt>
                            <dd className="mt-1 text-sm font-extrabold text-ink">
                              {analysis.predictionDetails.periodLabel ?? "조건 없음"}
                            </dd>
                          </div>
                        </dl>
                      )}

                      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#edf7f5] px-4 py-3.5">
                        <BadgeCheck aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-emerald-700" />
                        <p className="text-sm leading-6 text-slate-700">{analysis.description}</p>
                      </div>

                      <div className="mt-4">
                        {analysis.destinationHref ? (
                          <Link
                            href={appendAnalysisInput(analysis.destinationHref, selectedInput)}
                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-[#1c4053] sm:w-fit sm:min-w-64"
                          >
                            {isFact ? (
                              <FileCheck2 aria-hidden="true" className="size-4.5" />
                            ) : (
                              <BarChart3 aria-hidden="true" className="size-4.5" />
                            )}
                            {analysis.destinationLabel}
                            <ArrowRight aria-hidden="true" className="size-4" />
                          </Link>
                        ) : (
                          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-slate-50 px-4 text-sm font-bold text-muted">
                            <MessageSquareText aria-hidden="true" className="size-4" />
                            개인 의견으로 분류됨
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-4 text-xs leading-5 text-muted">
                문장 분리와 분류는 준비된 키워드 규칙을 사용합니다. 카드를 선택하면 해당 발언 한 개만 기존 결과 화면에 반영됩니다.
              </p>
            </div>
          </section>
        )}

        {result && results.length === 1 && !loading && (
          <section className="surface-card animate-enter overflow-hidden" aria-labelledby="result-title">
            <div className="flex flex-col gap-4 border-b border-line bg-[#f8fbfa] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Check aria-hidden="true" className="size-5" strokeWidth={2.6} />
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-700">데모 분석 완료</p>
                  <h2 id="result-title" className="mt-0.5 text-xl font-black tracking-[-0.02em] text-ink">
                    발언의 기록 경로를 찾았습니다
                  </h2>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <Sparkles aria-hidden="true" className="size-3.5" />
                AI 분류 신뢰수준 {result.confidence}%
              </span>
            </div>

            <div className="p-5 sm:p-7">
              <AnalysisInputSummary input={resultInput} />

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["발언 유형", result.label],
                  ["언급 종목", result.detectedEntity],
                  ["기록 판단", result.conditionLabel],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-line bg-white p-4">
                    <p className="text-xs font-semibold text-muted">{label}</p>
                    <p className="mt-1.5 text-sm font-extrabold leading-5 text-ink">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#edf7f5] px-4 py-4">
                <BadgeCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" />
                <p className="text-sm leading-6 text-slate-700">{result.description}</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {result.destinationHref ? (
                  <Link
                    href={appendAnalysisInput(result.destinationHref, resultInput)}
                    className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-[#1c4053] sm:col-span-2"
                  >
                    {result.kind === "fact" ? (
                      <FileCheck2 aria-hidden="true" className="size-4.5" />
                    ) : (
                      <BarChart3 aria-hidden="true" className="size-4.5" />
                    )}
                    {result.destinationLabel}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  <a
                    href="#analysis-form-title"
                    className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-[#1c4053] sm:col-span-2"
                  >
                    <ScanSearch aria-hidden="true" className="size-4.5" />
                    다른 발언 분석하기
                  </a>
                )}
                {result.receiptHref ? (
                  <Link
                    href={appendAnalysisInput(result.receiptHref, resultInput)}
                    className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-extrabold text-ink transition hover:bg-slate-50"
                  >
                    <FileText aria-hidden="true" className="size-4" />
                    발언 영수증
                  </Link>
                ) : (
                  <span className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-line bg-slate-50 px-4 text-sm font-bold text-muted">
                    <FileText aria-hidden="true" className="size-4" />
                    영수증 준비 중
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs leading-5 text-muted">
                상세 근거와 주가 수치는 준비된 예시 데이터를 사용합니다. 신뢰수준은 분류 결과에 대한 값이며 발언의 진실 확률이 아닙니다.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
