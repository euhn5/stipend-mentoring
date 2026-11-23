
export function formatWon(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return value.toLocaleString("ko-KR");
}


export function formatWonWithUnit(
  value: number | null | undefined
): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return `${formatWon(value)}원`;
}


export function formatOX(value: "O" | "X" | null | undefined): string {
  return value ?? "-";
}

export function maskResearcherNo(
  researcherNo: string | null | undefined
): string {
  if (!researcherNo) {
    return "-";
  }

  if (researcherNo.length <= 4) {
    return "****";
  }

  return researcherNo.slice(0, 4) + "*".repeat(researcherNo.length - 4);
}
