
import { describe, it, expect } from "vitest";
import {
  addMonths,
  termOf,
  termMonths,
  previousYmKst,
  lastDayOf,
} from "@/domain/month";

describe("addMonths", () => {
  it("연도를 넘어간다", () => {
    expect(addMonths("2026-11", 3)).toBe("2027-02");
    expect(addMonths("2026-03", -1)).toBe("2026-02");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });
});

describe("termOf", () => {
  it("기준월에 해당하는 학기를 반환한다", () => {
    expect(termOf("2026-03")).toBe("2026-1");
    expect(termOf("2026-09")).toBe("2026-2");
    expect(termOf("2027-02")).toBe("2026-2");
  });
});

describe("termMonths", () => {
  it("1학기의 6개월을 반환한다", () => {
    expect(termMonths("2026-1")).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
  });

  it("2학기의 6개월을 반환한다", () => {
    expect(termMonths("2026-2")).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
  });

  it("잘못된 학기 번호는 오류를 발생시킨다", () => {
    expect(() => termMonths("2026-3")).toThrow();
  });
});

describe("previousYmKst", () => {
  it("한국 시간 기준으로 전월을 계산한다", () => {
    const date = new Date("2026-10-15T00:00:00+09:00");
    expect(previousYmKst(date)).toBe("2026-09");
  });

  it("연도가 바뀌는 경우도 계산한다", () => {
    const date = new Date("2027-01-01T00:30:00+09:00");
    expect(previousYmKst(date)).toBe("2026-12");
  });

  it("UTC와 한국 날짜가 다를 때도 한국 시간을 사용한다", () => {
    const date = new Date("2026-08-31T16:00:00Z");
    expect(previousYmKst(date)).toBe("2026-08");
  });
});

// 새로 추가한 테스트
describe("lastDayOf", () => {
  it("2026년 2월은 28일까지 있다", () => {
    expect(lastDayOf("2026-02")).toBe("2026-02-28");
  });

  it("윤년인 2028년 2월은 29일까지 있다", () => {
    expect(lastDayOf("2028-02")).toBe("2028-02-29");
  });

  it("2026년 4월은 30일까지 있다", () => {
    expect(lastDayOf("2026-04")).toBe("2026-04-30");
  });

  it("2026년 12월은 31일까지 있다", () => {
    expect(lastDayOf("2026-12")).toBe("2026-12-31");
  });
});
