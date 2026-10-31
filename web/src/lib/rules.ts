
import { db } from "@/db/client";
import { ruleConfig } from "@/db/schema";
import type { Degree } from "./codes";

export type Rules = {
  eligibleAcadStatus: string;
  eligibleFulltimeYn: string;
  eligibleActivityTypes: string[];
  maxMonths: Record<Degree, number>;
  standardAmount: {
    석사: number;
    박사: number;
    석박통합Early: number;
    석박통합Late: number;
  };
  integratedLateFromSemester: number;
};

export async function loadRules(): Promise<Rules> {
  const rows = await db.select().from(ruleConfig);

  const config = new Map(
    rows.map((row) => [row.key, row.value])
  );

  function getString(key: string): string {
    const value = config.get(key);

    if (value === undefined || value.trim() === "") {
      throw new Error(`규칙 설정 누락: ${key}`);
    }

    return value.trim();
  }

  function getNumber(key: string): number {
    const value = getString(key);
    const number = Number(value);

    if (!Number.isFinite(number)) {
      throw new Error(`숫자 규칙 오류: ${key}`);
    }

    return number;
  }

  return {
    eligibleAcadStatus: getString("eligible.acad_status"),
    eligibleFulltimeYn: getString("eligible.fulltime_yn"),

    eligibleActivityTypes: getString(
      "eligible.activity_types"
    ).split(",").map((v) => v.trim()),

    maxMonths: {
      석사: getNumber("max_months.석사"),
      박사: getNumber("max_months.박사"),
      석박통합: getNumber("max_months.석박통합"),
    },

    standardAmount: {
      석사: getNumber("standard_amount.석사"),
      박사: getNumber("standard_amount.박사"),
      석박통합Early: getNumber(
        "standard_amount.석박통합.early"
      ),
      석박통합Late: getNumber(
        "standard_amount.석박통합.late"
      ),
    },

    integratedLateFromSemester: getNumber(
      "integrated.late_from_semester"
    ),
  };
}
