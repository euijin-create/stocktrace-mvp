import type { ContentAnalysisInput } from "@/lib/mock-analysis";

export type ShowcaseExampleKind = "fact-check" | "prediction";

export interface ShowcaseExample {
  badge: string;
  description: string;
  id: string;
  input: ContentAnalysisInput;
  kind: ShowcaseExampleKind;
  sourceNote: string;
  title: string;
}

export const showcaseExamples: ShowcaseExample[] = [
  {
    badge: "실제 OpenDART 공시 기반 사례",
    description: "공개 발언을 실제 금융감독원 공시와 비교합니다.",
    id: "hanwha-engine-open-dart",
    input: {
      contentUrl:
        "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20260828800365",
      influencerName: "시연 계정",
      statement:
        "한화엔진은 한화오션과 128,936,583,600원 규모의 선박용 엔진 공급계약을 체결했다.",
      statementDate: "2026-08-28",
    },
    kind: "fact-check",
    sourceNote: "한화엔진 · 발언 기준일 2026.08.28 · 접수번호 20260828800365",
    title: "공식자료 팩트체크",
  },
  {
    badge: "시연용 예측 문장 + 실제 시장데이터 평가",
    description: "과거 예측을 실제 주가와 시장지수로 사후평가합니다.",
    id: "samsung-market-evaluation",
    input: {
      contentUrl:
        "https://example.com/stocktrace-demo/samsung-prediction",
      influencerName: "시연 계정",
      statement: "삼성전자는 한 달 안에 10% 상승할 것이다.",
      statementDate: "2026-06-07",
    },
    kind: "prediction",
    sourceNote: "삼성전자 · 발언 기준일 2026.06.07 · 실제 인플루언서 발언이 아닌 시연용 문장",
    title: "과거 예측 사후평가",
  },
];
