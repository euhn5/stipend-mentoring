
export type OX = "O" | "X";

/**
 * 실지급액이 기준금액을 충족하는지 판정한다.
 * 기준금액이 없으면 null을 반환한다.
 */
export function meetsStandard(
  standardAmount: number | null,
  paidAmount: number
): OX | null {
  if (standardAmount === null) {
    return null;
  }

  return paidAmount >= standardAmount ? "O" : "X";
}

/**
 * 기준금액에서 실지급액을 뺀 부족금액을 계산한다.
 * 부족금액은 0보다 작아질 수 없다.
 */
export function shortage(
  standardAmount: number | null,
  paidAmount: number
): number | null {
  if (standardAmount === null) {
    return null;
  }

  return Math.max(0, standardAmount - paidAmount);
}
