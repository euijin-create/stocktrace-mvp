import {
  STOCK_DIRECTIONS,
  STOCK_STATEMENT_TYPES,
  type StockContentAnalysis,
  type StockDirection,
  type StockStatementAnalysis,
  type StockStatementType,
} from "@/lib/ai/types";

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }],
} as const;

const nullableNumberSchema = {
  anyOf: [{ type: "number" }, { type: "null" }],
} as const;

export const STOCK_CONTENT_ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["statements"],
  properties: {
    statements: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "statementType",
          "originalStatement",
          "company",
          "stockName",
          "direction",
          "targetPrice",
          "targetReturnPercent",
          "predictionPeriod",
          "conditions",
          "summary",
          "evaluationPossible",
          "evaluationMissingReason",
        ],
        properties: {
          statementType: { type: "string", enum: STOCK_STATEMENT_TYPES },
          originalStatement: { type: "string", minLength: 1, maxLength: 1000 },
          company: nullableStringSchema,
          stockName: nullableStringSchema,
          direction: { type: "string", enum: STOCK_DIRECTIONS },
          targetPrice: nullableNumberSchema,
          targetReturnPercent: nullableNumberSchema,
          predictionPeriod: nullableStringSchema,
          conditions: {
            type: "array",
            maxItems: 10,
            items: { type: "string", minLength: 1, maxLength: 300 },
          },
          summary: { type: "string", minLength: 1, maxLength: 500 },
          evaluationPossible: { type: "boolean" },
          evaluationMissingReason: nullableStringSchema,
        },
      },
    },
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStockStatementType(value: unknown): value is StockStatementType {
  return typeof value === "string" && STOCK_STATEMENT_TYPES.includes(value as StockStatementType);
}

export function isStockDirection(value: unknown): value is StockDirection {
  return typeof value === "string" && STOCK_DIRECTIONS.includes(value as StockDirection);
}

function readRequiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`Invalid ${field}`);
  return normalized;
}

function readNullableString(value: unknown, field: string, maxLength = 300): string | null {
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new Error(`Invalid ${field}`);
  return normalized;
}

function readNullableNumber(value: unknown, field: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Invalid ${field}`);
  return value;
}

function buildMissingReason(statement: StockStatementAnalysis): string {
  const missing: string[] = [];
  if (statement.direction !== "up" && statement.direction !== "down") {
    missing.push("상승 또는 하락 방향");
  }
  if (statement.targetPrice === null && statement.targetReturnPercent === null) {
    missing.push("구체적인 목표가격 또는 목표수익률");
  }
  if (statement.predictionPeriod === null) missing.push("예측 기간");
  return `${missing.join("과 ")}이 부족함`;
}

function normalizeStatement(value: unknown, sourceText: string): StockStatementAnalysis {
  if (!isRecord(value)) throw new Error("Invalid statement item");
  if (!isStockStatementType(value.statementType)) throw new Error("Invalid statementType");
  if (!isStockDirection(value.direction)) throw new Error("Invalid direction");
  if (!Array.isArray(value.conditions) || value.conditions.length > 10) {
    throw new Error("Invalid conditions");
  }

  const originalStatement = readRequiredString(value.originalStatement, "originalStatement", 1000);
  const compactSource = sourceText.replace(/\s+/g, " ").trim();
  if (!compactSource.includes(originalStatement)) {
    throw new Error("Analyzed statement is not present in the submitted text");
  }

  const statement: StockStatementAnalysis = {
    statementType: value.statementType,
    originalStatement,
    company: readNullableString(value.company, "company"),
    stockName: readNullableString(value.stockName, "stockName"),
    direction: value.direction,
    targetPrice: readNullableNumber(value.targetPrice, "targetPrice"),
    targetReturnPercent: readNullableNumber(value.targetReturnPercent, "targetReturnPercent"),
    predictionPeriod: readNullableString(value.predictionPeriod, "predictionPeriod"),
    conditions: value.conditions.map((condition) =>
      readRequiredString(condition, "condition", 300),
    ),
    summary: readRequiredString(value.summary, "summary", 500),
    evaluationPossible: value.evaluationPossible === true,
    evaluationMissingReason: readNullableString(
      value.evaluationMissingReason,
      "evaluationMissingReason",
      500,
    ),
  };

  if (statement.statementType !== "prediction") {
    return {
      ...statement,
      evaluationPossible: false,
      evaluationMissingReason:
        statement.evaluationMissingReason ?? "미래 주가 예측이 아니므로 사후 예측 평가 대상이 아님",
    };
  }

  const objectivelyEvaluable =
    (statement.direction === "up" || statement.direction === "down") &&
    (statement.targetPrice !== null || statement.targetReturnPercent !== null) &&
    statement.predictionPeriod !== null;

  if (!objectivelyEvaluable) {
    return {
      ...statement,
      evaluationPossible: false,
      evaluationMissingReason: statement.evaluationMissingReason ?? buildMissingReason(statement),
    };
  }

  return {
    ...statement,
    targetReturnPercent:
      statement.targetReturnPercent === null
        ? null
        : statement.direction === "down"
          ? -Math.abs(statement.targetReturnPercent)
          : Math.abs(statement.targetReturnPercent),
    evaluationPossible: true,
    evaluationMissingReason: null,
  };
}

export function parseStockContentAnalysis(
  value: unknown,
  sourceText: string,
): StockContentAnalysis {
  if (!isRecord(value) || !Array.isArray(value.statements)) {
    throw new Error("Invalid structured analysis response");
  }
  if (value.statements.length === 0 || value.statements.length > 20) {
    throw new Error("Invalid statement count");
  }

  return {
    statements: value.statements.map((statement) => normalizeStatement(statement, sourceText)),
  };
}
