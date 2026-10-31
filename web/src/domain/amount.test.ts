
import { describe, expect, it } from "vitest";
import { meetsStandard, shortage } from "./amount";

describe("기준금액 충족 여부", () => {
  it("지급액이 기준금액보다 많으면 O", () => {
    expect(meetsStandard(1100000, 1200000)).toBe("O");
  });

  it("지급액이 기준금액과 같으면 O", () => {
    expect(meetsStandard(800000, 800000)).toBe("O");
  });

  it("지급액이 부족하면 X", () => {
    expect(meetsStandard(1100000, 0)).toBe("X");
  });

  it("기준금액이 없으면 null", () => {
    expect(meetsStandard(null, 700000)).toBeNull();
  });
});

describe("부족금액 계산", () => {
  it("기준금액보다 적게 지급한 경우", () => {
    expect(shortage(800000, 500000)).toBe(300000);
  });

  it("기준금액보다 많이 지급한 경우", () => {
    expect(shortage(1100000, 1200000)).toBe(0);
  });

  it("기준금액과 동일하게 지급한 경우", () => {
    expect(shortage(800000, 800000)).toBe(0);
  });

  it("기준금액이 없으면 null", () => {
    expect(shortage(null, 700000)).toBeNull();
  });
});
