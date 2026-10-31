
import type { Degree } from "@/lib/codes";
import type { Rules } from "@/lib/rules";
import { addMonths } from "./month";

export type OX = "O" | "X";

export type EligibilityInput = {
  baseYm: string;
  degree: Degree;
  acadStatus: string;
  fulltimeYn: string;
  activityType: string;
  semesterNo: number;
  cumSupportMonths: number;
};

export type EligibilityResult = {
  r1: OX;
  r2: OX;
  r3: OX;
  r4: OX;
  overall: OX;
  maxSupportYm: string | null;
  standardAmount: number | null;
};

/**
 * 기준월 이전의 연구활동 이력에서
 * 인정되는 지원 개월 수를 계산한다.
 */
export function countCumSupportMonths(
  history: { ym: string; activityType: string }[],
  baseYm: string,
  rules: Rules
): number {
  return history.filter(
    (item) =>
      item.ym < baseYm &&
      rules.eligibleActivityTypes.includes(item.activityType)
  ).length;
}

/**
 * 학생의 연구생활장려금 지원요건을 판정한다.
 */
export function judge(
  input: EligibilityInput,
  rules: Rules
): EligibilityResult {
  const r1: OX =
    input.acadStatus === rules.eligibleAcadStatus ? "O" : "X";

  const r2: OX =
    input.fulltimeYn === rules.eligibleFulltimeYn ? "O" : "X";

  const r3: OX =
    rules.eligibleActivityTypes.includes(input.activityType)
      ? "O"
      : "X";

  const maxMonths = rules.maxMonths[input.degree];

  const r4: OX =
    input.cumSupportMonths < maxMonths ? "O" : "X";

  const overall: OX =
    [r1, r2, r3, r4].every((result) => result === "O")
      ? "O"
      : "X";

  const maxSupportYm =
    r4 === "O"
      ? addMonths(
          input.baseYm,
          maxMonths - input.cumSupportMonths - 1
        )
      : null;

  let standardAmount: number | null = null;

  if (overall === "O") {
    if (input.degree === "석사") {
      standardAmount = rules.standardAmount.석사;
    } else if (input.degree === "박사") {
      standardAmount = rules.standardAmount.박사;
    } else {
      standardAmount =
        input.semesterNo < rules.integratedLateFromSemester
          ? rules.standardAmount.석박통합Early
          : rules.standardAmount.석박통합Late;
    }
  }

  return {
    r1,
    r2,
    r3,
    r4,
    overall,
    maxSupportYm,
    standardAmount,
  };
}
