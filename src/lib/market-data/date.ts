const KOREA_TIME_ZONE = "Asia/Seoul";
const COMPLETE_DAILY_BAR_HOUR = 16;

type CalendarDate = {
  day: number;
  month: number;
  year: number;
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function calendarDateToString({ day, month, year }: CalendarDate): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseStrictDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2200 || month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { day, month, year };
}

export function compareDateStrings(left: string, right: string): number {
  return left.localeCompare(right, "en-US");
}

export function addCalendarDays(date: string, amount: number): string | null {
  const parsed = parseStrictDate(date);
  if (!parsed || !Number.isSafeInteger(amount)) return null;
  const value = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  value.setUTCDate(value.getUTCDate() + amount);
  return calendarDateToString({
    day: value.getUTCDate(),
    month: value.getUTCMonth() + 1,
    year: value.getUTCFullYear(),
  });
}

function addCalendarMonths(date: CalendarDate, amount: number): CalendarDate {
  const monthIndex = date.month - 1 + amount;
  const targetYear = date.year + Math.floor(monthIndex / 12);
  const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12;
  const targetMonth = normalizedMonthIndex + 1;
  return {
    day: Math.min(date.day, daysInMonth(targetYear, targetMonth)),
    month: targetMonth,
    year: targetYear,
  };
}

function readPeriodCount(raw: string): number | null {
  const koreanNumbers: Record<string, number> = {
    네: 4,
    두: 2,
    세: 3,
    한: 1,
  };
  if (raw in koreanNumbers) return koreanNumbers[raw];
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function calculateEvaluationDate(
  statementDate: string,
  predictionPeriod: string | null | undefined,
): string | null {
  const parsedDate = parseStrictDate(statementDate);
  if (!parsedDate || !predictionPeriod) return null;
  const match = /^\s*(\d+|한|두|세|네)\s*(일|주|개월|달|년)\s*(?:이내|안|후|동안)?\s*$/.exec(
    predictionPeriod,
  );
  if (!match) return null;
  const count = readPeriodCount(match[1]);
  if (!count || count > 3_650) return null;

  if (match[2] === "일") return addCalendarDays(statementDate, count);
  if (match[2] === "주") return addCalendarDays(statementDate, count * 7);
  if (match[2] === "개월" || match[2] === "달") {
    return calendarDateToString(addCalendarMonths(parsedDate, count));
  }
  return calendarDateToString(addCalendarMonths(parsedDate, count * 12));
}

export function toKoreanMarketDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: KOREA_TIME_ZONE,
    year: "numeric",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function toKoreanMidnight(date: string): Date | null {
  if (!parseStrictDate(date)) return null;
  return new Date(`${date}T00:00:00+09:00`);
}

export function isCompletedDailyDate(date: string, now = new Date()): boolean {
  const today = toKoreanMarketDate(now);
  if (date < today) return true;
  if (date > today) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: KOREA_TIME_ZONE,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  return hour >= COMPLETE_DAILY_BAR_HOUR;
}
