
import { describe, expect, it } from "vitest";
import { diffFields } from "./checks";

describe("diffFields", () => {
  it("모든 필드가 같으면 일치로 판정한다", () => {
    const ours = {
      name: "김민준",
      dept: "컴퓨터공학과",
      degree: "박사",
    };

    const source = { ...ours };

    const result = diffFields(ours, source, [
      "name",
      "dept",
      "degree",
    ]);

    expect(result.ok).toBe(true);
    expect(result.diffs).toEqual([]);
  });

  it("학과가 다르면 불일치로 판정한다", () => {
    const ours = {
      name: "김민준",
      dept: "컴퓨터공학과",
    };

    const source = {
      name: "김민준",
      dept: "소프트웨어학과",
    };

    const result = diffFields(ours, source, [
      "name",
      "dept",
    ]);

    expect(result.ok).toBe(false);
    expect(result.diffs).toEqual([
      {
        field: "dept",
        ours: "컴퓨터공학과",
        source: "소프트웨어학과",
      },
    ]);
  });

  it("비교하지 않는 필드의 차이는 무시한다", () => {
    const ours = {
      name: "김민준",
      dept: "컴퓨터공학과",
    };

    const source = {
      name: "김민준",
      dept: "소프트웨어학과",
    };

    const result = diffFields(ours, source, ["name"]);

    expect(result.ok).toBe(true);
    expect(result.diffs).toHaveLength(0);
  });

  it("원천 데이터가 없으면 불일치로 판정한다", () => {
    const ours = {
      name: "김민준",
      dept: "컴퓨터공학과",
    };

    const result = diffFields(ours, null, [
      "name",
      "dept",
    ]);

    expect(result.ok).toBe(false);
    expect(result.note).toBe("원천에 없음");
  });

  it("연동 데이터가 없으면 불일치로 판정한다", () => {
    const source = {
      name: "김민준",
      dept: "컴퓨터공학과",
    };

    const result = diffFields(null, source, [
      "name",
      "dept",
    ]);

    expect(result.ok).toBe(false);
    expect(result.note).toBe("연동 데이터가 없음");
  });
});
