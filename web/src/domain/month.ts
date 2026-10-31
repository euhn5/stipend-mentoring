
/**
 * 기준월에 n개월을 더한다.
 * 예: addMonths("2026-11", 3) → "2027-02"
 */
export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);

  const total = y * 12 + (m - 1) + n;

  return `${Math.floor(total / 12)}-${String(
    (total % 12) + 1
  ).padStart(2, "0")}`;
}

/**
 * 기준월이 속한 학기를 반환한다.
 *
 * 3월~8월  → 해당 연도 1학기
 * 9월~12월 → 해당 연도 2학기
 * 1월~2월  → 전년도 2학기
 */
export function termOf(ym: string): string {
  const [year, month] = ym.split("-").map(Number);

  if (month >= 3 && month <= 8) {
    return `${year}-1`;
  }

  if (month >= 9 && month <= 12) {
    return `${year}-2`;
  }

  return `${year - 1}-2`;
}

/**
 * 학기에 포함되는 6개월을 반환한다.
 * 예: termMonths("2026-2")
 * → ["2026-09", ..., "2027-02"]
 */
export function termMonths(term: string): string[] {
  const [yearText, semesterText] = term.split("-");
  const year = Number(yearText);
  const semester = Number(semesterText);

  if (semester !== 1 && semester !== 2) {
    throw new Error("학기는 1 또는 2여야 합니다.");
  }

  const startYm = `${year}-${semester === 1 ? "03" : "09"}`;

  return Array.from({ length: 6 }, (_, i) =>
    addMonths(startYm, i)
  );
}

/**
 * 한국 시간 기준 전월을 반환한다.
 */
export function previousYmKst(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;

  return addMonths(`${year}-${month}`, -1);
}
