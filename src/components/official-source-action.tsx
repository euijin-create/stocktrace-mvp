"use client";

import { useState } from "react";
import { ExternalLink, FileSearch, Info } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";

export interface OfficialSourceActionProps {
  sourceUrl?: string;
}

export function OfficialSourceAction({ sourceUrl }: OfficialSourceActionProps) {
  const [open, setOpen] = useState(false);

  if (sourceUrl) {
    return (
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3.5 text-xs font-extrabold text-ink transition hover:bg-slate-50"
      >
        원문 보기
        <ExternalLink aria-hidden="true" className="size-3.5" />
        <span className="sr-only">새 창에서 열기</span>
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3.5 text-xs font-extrabold text-ink transition hover:border-[#9db8c0] hover:bg-slate-50"
      >
        데모 원문 보기
        <FileSearch aria-hidden="true" className="size-3.5" />
      </button>

      <ModalDialog
        open={open}
        onClose={() => setOpen(false)}
        title="공식자료 원문 안내"
        description="근거자료 연결 방식에 대한 데모 안내입니다."
      >
        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-action shadow-sm">
              <Info aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-base font-extrabold leading-7 text-ink">
              현재 MVP에서는 예시 자료를 사용하고 있습니다.
            </p>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              실제 서비스에서는 공식 공시 원문으로 연결됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-5 min-h-12 w-full rounded-xl bg-ink px-4 text-sm font-extrabold text-white transition hover:bg-[#1c4053]"
          >
            확인
          </button>
        </div>
      </ModalDialog>
    </>
  );
}
