
import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { seedAll } from "@/db/seed";
import { srcAcademicMonthly } from "@/db/schema";

import { runAcadJob } from "@/jobs/acad";
import { getRoster } from "./roster";

describe("학생연구자 명부 조회", () => {
  beforeEach(async () => {
    await seedAll();
  });

  it("2026년 3월 명부에 11명이 나오고 CHK-01~03이 모두 일치한다", async () => {
    const result = await runAcadJob("2026-03", "MANUAL");

    expect(result.status).toBe("SUCCESS");

    const rows = await getRoster({
      ym: "2026-03",
    });

    expect(rows).toHaveLength(11);

    for (const row of rows) {
      expect(row.chk01.ok).toBe(true);
      expect(row.chk02.ok).toBe(true);
      expect(row.chk03.ok).toBe(true);
    }
  });

  it("종합 X 필터를 적용하면 S04 한 명만 조회된다", async () => {
    await runAcadJob("2026-03", "MANUAL");

    const rows = await getRoster({
      ym: "2026-03",
      overall: "X",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].studentNo).toBe("2024210004");
    expect(rows[0].overall).toBe("X");
  });

  it("원천 학과 변경을 감지하고 재연동 후 일치로 돌아온다", async () => {
    const baseYm = "2026-03";
    const studentNo = "2024210007";

    // 1. 최초 학적 연동
    await runAcadJob(baseYm, "MANUAL");

    // 2. 원천 학과 정보를 변경
    await db
      .update(srcAcademicMonthly)
      .set({ dept: "소프트웨어학과" })
      .where(
        and(
          eq(srcAcademicMonthly.baseYm, baseYm),
          eq(srcAcademicMonthly.studentNo, studentNo)
        )
      );

    // 3. 재연동 전에는 CHK-01 불일치
    const before = await getRoster({ ym: baseYm });

    const changedStudent = before.find(
      (row) => row.studentNo === studentNo
    );

    expect(changedStudent).toBeDefined();
    expect(changedStudent?.chk01.ok).toBe(false);

    const deptDiff = changedStudent?.chk01.diffs.find(
      (diff) => diff.field === "dept"
    );

    expect(deptDiff).toBeDefined();
    expect(deptDiff?.source).toBe("소프트웨어학과");

    // 4. 학적 연동을 다시 실행
    const result = await runAcadJob(baseYm, "MANUAL");

    expect(result.status).toBe("SUCCESS");

    // 5. 재연동 후에는 다시 일치
    const after = await getRoster({ ym: baseYm });

    const updatedStudent = after.find(
      (row) => row.studentNo === studentNo
    );

    expect(updatedStudent?.dept).toBe("소프트웨어학과");
    expect(updatedStudent?.chk01.ok).toBe(true);
    expect(updatedStudent?.chk02.ok).toBe(true);
    expect(updatedStudent?.chk03.ok).toBe(true);
  });
});
