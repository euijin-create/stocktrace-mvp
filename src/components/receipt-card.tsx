import {
  BadgeCheck,
  CalendarDays,
  CircleAlert,
  ExternalLink,
  FileClock,
  History,
  Link2,
  ReceiptText,
} from "lucide-react";

export type ReceiptStatus =
  | "recorded"
  | "source_changed"
  | "source_unavailable";

export type ReceiptHistoryType =
  | "captured"
  | "modified"
  | "made_private"
  | "deleted"
  | "restored";

export interface ReceiptMoney {
  amount: number;
  currency: string;
}

export interface ReceiptPriceSnapshot {
  price: ReceiptMoney;
  capturedAt: string;
  sourceLabel: string;
}

export interface ReceiptSnapshot {
  influencerName: string;
  originalText: string;
  contentUrl: string;
  publishedAt?: string;
  stockName?: string;
  stockSymbol?: string;
  priceAtStatement?: ReceiptPriceSnapshot;
  claimType: string;
}

export interface ReceiptHistoryItem {
  id: string;
  type: ReceiptHistoryType;
  observedAt: string;
  title: string;
  description: string;
}

export interface ReceiptCardReceipt {
  id: string;
  recordedAt: string;
  status: ReceiptStatus;
  snapshot: ReceiptSnapshot;
  history: ReceiptHistoryItem[];
}

export interface ReceiptCardProps {
  receipt: ReceiptCardReceipt;
  className?: string;
}

const STATUS_META: Record<
  ReceiptStatus,
  {
    label: string;
    description: string;
    className: string;
    icon: typeof BadgeCheck;
  }
> = {
  recorded: {
    label: "기록 완료",
    description: "발언 스냅샷이 StockTrace에 기록되었습니다.",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    icon: BadgeCheck,
  },
  source_changed: {
    label: "원본 변경 감지",
    description: "기록 후 원본 콘텐츠의 표시 상태가 달라진 이력이 있습니다.",
    className: "bg-amber-50 text-amber-900 ring-amber-200",
    icon: History,
  },
  source_unavailable: {
    label: "원본 확인 불가",
    description: "현재 원본 콘텐츠에 접근하여 상태를 확인할 수 없습니다.",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: CircleAlert,
  },
};

const CLAIM_TYPE_LABELS: Record<string, string> = {
  verifiable_fact: "공식자료 확인 가능 사실 주장",
  context_risk: "과장 또는 맥락 누락 가능 표현",
  price_prediction: "미래 주가 예측",
  opinion: "개인적 의견",
  conflict_disclosure: "이해관계 관련 표현",
};

const HISTORY_STATUS_LABELS: Record<ReceiptHistoryType, string> = {
  captured: "기록됨",
  modified: "수정 확인",
  made_private: "비공개 확인",
  deleted: "접근 불가 확인",
  restored: "공개 복원 확인",
};

function formatMoney(money: ReceiptMoney) {
  try {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: money.currency,
      maximumFractionDigits: 0,
    }).format(money.amount);
  } catch {
    return `${money.amount.toLocaleString("ko-KR")} ${money.currency}`;
  }
}

function displayUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function HistoryIcon({ type }: { type: ReceiptHistoryType }) {
  if (type === "captured" || type === "restored") {
    return <BadgeCheck aria-hidden="true" className="size-4" />;
  }
  if (type === "modified") {
    return <FileClock aria-hidden="true" className="size-4" />;
  }
  return <CircleAlert aria-hidden="true" className="size-4" />;
}

export function ReceiptCard({ receipt, className = "" }: ReceiptCardProps) {
  const { snapshot } = receipt;
  const status = STATUS_META[receipt.status];
  const StatusIcon = status.icon;
  const stockLabel = snapshot.stockName
    ? `${snapshot.stockName}${snapshot.stockSymbol ? ` · ${snapshot.stockSymbol}` : ""}`
    : "종목 미특정";
  const lastObservedAt =
    receipt.history[receipt.history.length - 1]?.observedAt ?? receipt.recordedAt;

  return (
    <article
      className={`surface-card min-w-0 overflow-hidden p-5 sm:p-6 ${className}`}
    >
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <ReceiptText aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.08em] text-slate-500">
              STATEMENT RECEIPT
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
              발언 영수증
            </h2>
            <p className="mt-0.5 truncate text-xs text-slate-500" title={receipt.id}>
              기록 ID · {receipt.id}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.className}`}
        >
          <StatusIcon aria-hidden="true" className="size-3.5" />
          {status.label}
        </span>
      </header>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold text-slate-500">원문 발언</p>
        <blockquote className="mt-2 break-words text-[15px] font-semibold leading-7 text-slate-900">
          “{snapshot.originalText}”
        </blockquote>
        <p className="mt-3 text-sm text-slate-600">
          발언자 <strong className="font-semibold text-slate-900">{snapshot.influencerName}</strong>
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <ReceiptMeta label="해당 종목" value={stockLabel} />
        <ReceiptMeta
          label="발언 유형"
          value={CLAIM_TYPE_LABELS[snapshot.claimType] ?? snapshot.claimType}
        />
        <ReceiptMeta label="게시 날짜" value={snapshot.publishedAt ?? "미확인"} />
        <ReceiptMeta label="StockTrace 기록일" value={receipt.recordedAt} />
        <ReceiptMeta
          label="발언 당시 주가"
          value={
            snapshot.priceAtStatement
              ? formatMoney(snapshot.priceAtStatement.price)
              : "미기록"
          }
          detail={
            snapshot.priceAtStatement
              ? `${snapshot.priceAtStatement.capturedAt} · ${snapshot.priceAtStatement.sourceLabel}`
              : undefined
          }
        />
        <div className="min-w-0">
          <dt className="text-xs font-medium text-slate-500">콘텐츠 원본</dt>
          <dd className="mt-1 min-w-0">
            <a
              href={snapshot.contentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-action hover:underline"
              title={snapshot.contentUrl}
            >
              <Link2 aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{displayUrl(snapshot.contentUrl)}</span>
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="sr-only">새 창에서 열기</span>
            </a>
          </dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="flex items-start gap-2 text-sm leading-6 text-slate-600">
          <StatusIcon aria-hidden="true" className="mt-1 size-4 shrink-0 text-slate-500" />
          <span>{status.description}</span>
        </p>
      </div>

      <section className="mt-6 border-t border-slate-200 pt-5" aria-labelledby={`history-${receipt.id}`}>
        <div className="flex items-center justify-between gap-3">
          <h3
            id={`history-${receipt.id}`}
            className="flex items-center gap-2 text-sm font-bold text-slate-900"
          >
            <History aria-hidden="true" className="size-4 text-brand" />
            콘텐츠 변경 이력
          </h3>
          <span className="number-tabular text-xs text-slate-500">
            {receipt.history.length}건
          </span>
        </div>

        {receipt.history.length > 0 ? (
          <ol className="relative mt-5">
            {receipt.history.map((item, index) => (
              <li
                key={item.id}
                className="relative grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3 pb-5"
              >
                <span
                  aria-hidden="true"
                  className="absolute -bottom-4 left-[15px] top-8 w-px bg-slate-200"
                />
                <span className="z-10 grid size-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                  <HistoryIcon type={item.type} />
                </span>
                <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                      {index + 1}단계 · {HISTORY_STATUS_LABELS[item.type]}
                    </span>
                    <time className="number-tabular shrink-0 text-xs font-medium text-slate-500">
                      {item.observedAt}
                    </time>
                  </div>
                  <p className="mt-2.5 break-words text-sm font-extrabold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
            <li className="relative grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3">
              <span className="z-10 grid size-8 place-items-center rounded-full border border-brand/30 bg-[#eaf4f2] text-brand shadow-sm">
                <StatusIcon aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 rounded-xl border border-brand/20 bg-[#f4f9f8] px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-inset ring-brand/20">
                    현재 상태
                  </span>
                  <time className="number-tabular shrink-0 text-xs font-medium text-slate-500">
                    마지막 확인 · {lastObservedAt}
                  </time>
                </div>
                <p className="mt-2.5 text-sm font-extrabold text-slate-900">{status.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{status.description}</p>
              </div>
            </li>
          </ol>
        ) : (
          <p className="mt-3 text-sm text-slate-500">기록된 변경 이력이 없습니다.</p>
        )}

        <p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            변경 이력은 원본 콘텐츠의 접근·표시 상태만 기록하며,
            변경 사유나 의도를 판단하지 않습니다.
          </span>
        </p>
      </section>
    </article>
  );
}

function ReceiptMeta({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900">
        {value}
      </dd>
      {detail ? (
        <dd className="mt-0.5 break-words text-xs leading-5 text-slate-500">
          {detail}
        </dd>
      ) : null}
    </div>
  );
}
