import { splitStatementsWithMock } from "@/lib/mock-analysis";
import type {
  StockAnalysisProvider,
  StockContentAnalysis,
  StockDirection,
  StockStatementAnalysis,
  StockStatementType,
} from "@/lib/ai/types";

function extractCompany(statement: string): string | null {
  const placeholderCompany = statement.match(/(?:^|\s)([A-Z]\s*사)(?=[은는이가을를의와과\s]|$)/i)?.[1];
  if (placeholderCompany) return placeholderCompany.replace(/\s+/g, "");

  return statement.match(/([가-힣A-Za-z0-9]{2,30}(?:전자|바이오|홀딩스|테크|기업))/)?.[1] ?? null;
}

function extractDirection(statement: string): StockDirection {
  if (/(하락|내릴|내려|떨어질|떨어진|빠질)/.test(statement)) return "down";
  if (/(상승|오를|오른|올라|급등|간다|갈 것이다)/.test(statement)) return "up";
  return "unknown";
}

function extractReturn(statement: string, direction: StockDirection): number | null {
  const match = statement.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;
  return direction === "down" ? -Math.abs(amount) : Math.abs(amount);
}

function extractTargetPrice(statement: string): number | null {
  const match = statement.match(/(?:목표가(?:격)?|주가)\s*(?:는|가|을|를|:)?\s*([\d,]+(?:\.\d+)?)\s*(억|만)?\s*원/);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return null;
  const multiplier = match[2] === "억" ? 100_000_000 : match[2] === "만" ? 10_000 : 1;
  return amount * multiplier;
}

function extractPeriod(statement: string): string | null {
  const numeric = statement.match(/(\d+(?:\.\d+)?)\s*(일|주|개월|달|년)/);
  if (numeric) return `${numeric[1]}${numeric[2] === "달" ? "개월" : numeric[2]}`;

  const korean = statement.match(/(한|두|세|네)\s*(일|주|개월|달|년)/);
  if (!korean) return null;
  const amount = { 한: 1, 두: 2, 세: 3, 네: 4 }[korean[1] as "한" | "두" | "세" | "네"];
  return `${amount}${korean[2] === "달" ? "개월" : korean[2]}`;
}

function classify(statement: string): StockStatementType {
  if (/(유료\s*광고|광고\s*포함|협찬|보유\s*(?:중|하고)|제\s*보유|이해관계)/.test(statement)) {
    return "advertising_or_conflict";
  }
  if (/(무조건|반드시|100\s*%|최대\s*수혜주|확실한\s*대장주|절대)/.test(statement)) {
    return "exaggeration_or_context_missing";
  }
  if (/(생각(?:한다|합니다|해요)|본다|봅니다|판단|저평가|좋은\s*회사)/.test(statement)) {
    return "opinion";
  }
  if (/(상승|하락|오를|오른|내릴|떨어질|급등|목표가|수익률|전망|갈\s*것이다|간다)/.test(statement)) {
    return "prediction";
  }
  return "fact_claim";
}

function makeSummary(type: StockStatementType, statement: string): string {
  const sentence = statement.replace(/[.!?]+$/g, "").trim();
  if (type === "fact_claim") return `${sentence}는 주장`;
  if (type === "prediction") return `“${sentence}”라는 미래 주가 예측`;
  if (type === "opinion") return "기업 가치에 대한 개인적인 판단이나 의견이 포함된 발언";
  if (type === "exaggeration_or_context_missing") {
    return "과도하게 단정적이거나 핵심 조건과 맥락이 생략되었을 수 있는 표현";
  }
  return "광고·협찬·종목 보유 등 이해관계와 관련된 표현이 포함된 발언";
}

function buildMockStatement(statement: string): StockStatementAnalysis {
  const statementType = classify(statement);
  const isPrediction = statementType === "prediction";
  const direction = isPrediction ? extractDirection(statement) : statementType === "fact_claim" ? "unknown" : "neutral";
  const targetPrice = isPrediction ? extractTargetPrice(statement) : null;
  const targetReturnPercent = isPrediction ? extractReturn(statement, direction) : null;
  const predictionPeriod = isPrediction ? extractPeriod(statement) : null;
  const evaluationPossible =
    isPrediction &&
    (direction === "up" || direction === "down") &&
    (targetPrice !== null || targetReturnPercent !== null) &&
    predictionPeriod !== null;

  const missing: string[] = [];
  if (isPrediction && direction !== "up" && direction !== "down") missing.push("상승 또는 하락 방향");
  if (isPrediction && targetPrice === null && targetReturnPercent === null) {
    missing.push("구체적인 목표가격 또는 목표수익률");
  }
  if (isPrediction && predictionPeriod === null) missing.push("예측 기간");

  return {
    statementType,
    originalStatement: statement,
    company: extractCompany(statement),
    stockName: null,
    direction,
    targetPrice,
    targetReturnPercent,
    predictionPeriod,
    conditions: [],
    summary: makeSummary(statementType, statement),
    evaluationPossible,
    evaluationMissingReason: evaluationPossible
      ? null
      : isPrediction
        ? `${missing.join("과 ")}이 부족함`
        : "미래 주가 예측이 아니므로 사후 예측 평가 대상이 아님",
  };
}

export class MockStockAnalysisProvider implements StockAnalysisProvider {
  async analyze(statementText: string): Promise<StockContentAnalysis> {
    let contextCompany: string | null = null;
    return {
      statements: splitStatementsWithMock(statementText).map((statement) => {
        const analysis = buildMockStatement(statement);
        if (analysis.company) {
          contextCompany = analysis.company;
          return analysis;
        }
        if (contextCompany && analysis.statementType !== "advertising_or_conflict") {
          return { ...analysis, company: contextCompany };
        }
        return analysis;
      }),
    };
  }
}
