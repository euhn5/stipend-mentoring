
import { describe, it, expect } from "vitest";
import { formatWon, formatOX, maskResearcherNo } from "./format";

describe("표시 형식 함수 테스트", () => {
  it("금액에 천 단위 쉼표를 표시한다", () => {
    expect(formatWon(1200000)).toBe("1,200,000");
    expect(formatWon(0)).toBe("0");
    expect(formatWon(null)).toBe("-");
  });

  it("O/X 판정 결과를 표시한다", () => {
    expect(formatOX("O")).toBe("O");
    expect(formatOX("X")).toBe("X");
    expect(formatOX(null)).toBe("-");
  });

  it("연구자번호의 뒤 4자리를 가린다", () => {
    expect(maskResearcherNo("20000001")).toBe("2000****");
    expect(maskResearcherNo(null)).toBe("-");
  });
});
