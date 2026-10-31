
import { describe, expect, it } from "vitest";
import { countCumSupportMonths, judge } from "./eligibility";
import type { EligibilityInput } from "./eligibility";
import type { Rules } from "@/lib/rules";

const rules: Rules = {
  eligibleAcadStatus: "재학",
  eligibleFulltimeYn: "Y",
  eligibleActivityTypes: ["RND", "LAB"],
  maxMonths: {
    석사: 24,
    박사: 48,
    석박통합: 72,
  },
  standardAmount: {
    석사: 800000,
    박사: 1100000,
    석박통합Early: 800000,
    석박통합Late: 1100000,
  },
  integratedLateFromSemester: 5,
};

function makeInput(
  overrides: Partial<EligibilityInput> = {}
): EligibilityInput {
  return {
    baseYm: "2026-03",
    degree: "박사",
    acadStatus: "재학",
    fulltimeYn: "Y",
    activityType: "RND",
    semesterNo: 5,
    cumSupportMonths: 24,
    ...overrides,
  };
}

describe("지원요건 판정 judge", () => {
  it("S01: 정상 박사과정 학생", () => {
    const result = judge(makeInput(), rules);

    expect(result.r1).toBe("O");
    expect(result.r2).toBe("O");
    expect(result.r3).toBe("O");
    expect(result.r4).toBe("O");
    expect(result.overall).toBe("O");
    expect(result.maxSupportYm).toBe("2028-02");
    expect(result.standardAmount).toBe(1100000);
  });

  it("S03: 휴학 및 연구활동 없음", () => {
    const result = judge(
      makeInput({
        degree: "석사",
        acadStatus: "휴학",
        activityType: "NONE",
        semesterNo: 3,
        cumSupportMonths: 14,
        baseYm: "2026-05",
      }),
      rules
    );

    expect([result.r1, result.r2, result.r3, result.r4]).toEqual([
      "X", "O", "X", "O",
    ]);
    expect(result.overall).toBe("X");
    expect(result.maxSupportYm).toBe("2027-02");
    expect(result.standardAmount).toBeNull();
  });

  it("S04: 비전일제 박사과정", () => {
    const result = judge(makeInput({ fulltimeYn: "N" }), rules);

    expect([result.r1, result.r2, result.r3, result.r4]).toEqual([
      "O", "X", "O", "O",
    ]);
    expect(result.overall).toBe("X");
    expect(result.standardAmount).toBeNull();
  });

  it("S05: 석박통합 4학기", () => {
    const result = judge(
      makeInput({
        degree: "석박통합",
        activityType: "LAB",
        semesterNo: 4,
        cumSupportMonths: 18,
      }),
      rules
    );

    expect(result.overall).toBe("O");
    expect(result.maxSupportYm).toBe("2030-08");
    expect(result.standardAmount).toBe(800000);
  });

  it("S11: 석박통합 5학기", () => {
    const result = judge(
      makeInput({
        degree: "석박통합",
        semesterNo: 5,
      }),
      rules
    );

    expect(result.overall).toBe("O");
    expect(result.standardAmount).toBe(1100000);
  });

  it("S06: 지원기간 마지막 달", () => {
    const result = judge(
      makeInput({
        degree: "석사",
        semesterNo: 4,
        cumSupportMonths: 23,
        baseYm: "2026-05",
      }),
      rules
    );

    expect(result.r4).toBe("O");
    expect(result.maxSupportYm).toBe("2026-05");
  });

  it("S06: 지원기간 만료", () => {
    const result = judge(
      makeInput({
        degree: "석사",
        semesterNo: 4,
        cumSupportMonths: 24,
        baseYm: "2026-06",
      }),
      rules
    );

    expect(result.r4).toBe("X");
    expect(result.overall).toBe("X");
    expect(result.maxSupportYm).toBeNull();
  });

  it("석사 누적 20개월의 지원가능 기한", () => {
    const result = judge(
      makeInput({
        degree: "석사",
        cumSupportMonths: 20,
      }),
      rules
    );

    expect(result.maxSupportYm).toBe("2026-06");
  });
});

describe("누적지원개월 계산", () => {
  it("기준월 이전 RND/LAB 활동만 계산한다", () => {
    const history = [
      { ym: "2026-01", activityType: "RND" },
      { ym: "2026-02", activityType: "LAB" },
      { ym: "2026-02", activityType: "NONE" },
      { ym: "2026-03", activityType: "RND" },
    ];

    expect(countCumSupportMonths(history, "2026-03", rules)).toBe(2);
  });

  it("S06: 22개월의 누적 지원 이력", () => {
    const history = Array.from({ length: 22 }, (_, i) => {
      const year = 2024 + Math.floor((5 + i) / 12);
      const month = ((5 + i) % 12) + 1;

      return {
        ym: `${year}-${String(month).padStart(2, "0")}`,
        activityType: "RND",
      };
    });

    expect(countCumSupportMonths(history, "2026-04", rules)).toBe(22);
  });
});
