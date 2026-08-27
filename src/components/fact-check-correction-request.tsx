"use client";

import { useState } from "react";
import { FilePenLine, Info, MessageSquareText, Send } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";

export function FactCheckCorrectionRequest() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestType, setRequestType] = useState("objection");
  const [requestContent, setRequestContent] = useState("");
  const [referenceNote, setReferenceNote] = useState("");

  function closeDialog() {
    setOpen(false);
    setSubmitted(false);
    setRequestType("objection");
    setRequestContent("");
    setReferenceNote("");
  }

  function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="surface-card p-5" aria-labelledby="correction-request-title">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e9f2f3] text-brand">
          <MessageSquareText aria-hidden="true" className="size-4.5" />
        </span>
        <div>
          <h2 id="correction-request-title" className="text-sm font-black text-ink">
            반론·정정 요청 권리
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-muted">
            StockTrace는 정보 제공자가 분석 결과를 검토하고 반론이나 정정을 요청할 수 있는 절차를 보장합니다.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-[#f1f8f7] px-3 text-sm font-extrabold text-brand transition hover:border-brand/50 hover:bg-[#e7f3f1]"
      >
        <FilePenLine aria-hidden="true" className="size-4" />
        분석 결과에 이의제기 · 정정 요청
      </button>

      <ModalDialog
        open={open}
        onClose={closeDialog}
        title="이의제기 또는 정정 요청"
        description="분석 대상자는 다른 해석이나 추가 근거를 제시할 수 있습니다. 현재 입력 내용은 저장되거나 전송되지 않습니다."
      >
        {submitted ? (
          <div className="p-5 sm:p-6">
            <div role="status" className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-action shadow-sm">
                <Info aria-hidden="true" className="size-5" />
              </span>
              <p className="mt-4 text-base font-extrabold leading-7 text-ink">
                데모 환경에서는 실제 요청이 접수되지 않습니다.
              </p>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">
                실제 서비스에서는 접수 상태와 검토 결과를 요청자에게 투명하게 안내할 예정입니다.
              </p>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              className="mt-5 min-h-12 w-full rounded-xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-[#1c4053]"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={submitRequest} className="p-5 sm:p-6">
            <div className="space-y-5">
              <div>
                <label htmlFor="correction-request-type" className="mb-2 block text-sm font-bold text-ink">
                  요청 유형
                </label>
                <select
                  id="correction-request-type"
                  value={requestType}
                  onChange={(event) => setRequestType(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-action focus:ring-3 focus:ring-blue-100"
                >
                  <option value="objection">분석 결과에 대한 이의제기</option>
                  <option value="correction">사실관계 정정 요청</option>
                  <option value="additional-evidence">추가 근거 제출</option>
                </select>
              </div>

              <div>
                <label htmlFor="correction-request-content" className="mb-2 block text-sm font-bold text-ink">
                  요청 내용
                </label>
                <textarea
                  id="correction-request-content"
                  required
                  rows={4}
                  value={requestContent}
                  onChange={(event) => setRequestContent(event.target.value)}
                  placeholder="재검토가 필요한 내용과 이유를 입력해 주세요."
                  className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-action focus:ring-3 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="correction-reference-note" className="mb-2 block text-sm font-bold text-ink">
                  참고 설명 또는 근거
                </label>
                <textarea
                  id="correction-reference-note"
                  rows={3}
                  value={referenceNote}
                  onChange={(event) => setReferenceNote(event.target.value)}
                  placeholder="참고할 공식자료, 문서명 또는 추가 설명을 입력해 주세요."
                  className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-action focus:ring-3 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2.5 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                className="min-h-11 rounded-xl border border-line bg-white px-5 text-sm font-bold text-ink transition hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-[#1c4053]"
              >
                <Send aria-hidden="true" className="size-4" />
                데모 요청 제출
              </button>
            </div>
          </form>
        )}
      </ModalDialog>
    </section>
  );
}
