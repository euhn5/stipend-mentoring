
import { beforeEach, describe, expect, it } from "vitest";
import { seedAll } from "@/db/seed";
import { loadRules } from "./rules";

describe("규칙 설정 통합 테스트", () => {
  beforeEach(async () => {
    await seedAll();
  });

  it("최대 지원기간을 정확하게 읽는다", async () => {
    const rules = await loadRules();

    expect(rules.maxMonths.석사).toBe(24);
    expect(rules.maxMonths.박사).toBe(48);
    expect(rules.maxMonths.석박통합).toBe(72);
  });

  it("기준금액을 정확하게 읽는다", async () => {
    const rules = await loadRules();

    expect(rules.standardAmount.석사).toBe(800000);
    expect(rules.standardAmount.박사).toBe(1100000);
    expect(rules.integratedLateFromSemester).toBe(5);
  });
});