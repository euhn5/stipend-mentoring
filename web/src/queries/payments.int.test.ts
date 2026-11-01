
import { beforeEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { seedAll } from "@/db/seed";
import { srcPayment } from "@/db/schema";

import { runAcadJob } from "@/jobs/acad";
import { runPayJob } from "@/jobs/pay";
import { getPayments } from "./payments";

describe("학생지원금 지급내역 조회", () => {
  beforeEach(async () => {
    await seedAll();
  });

  it("2026년 3월 총지급액과 CHK-04·05가 정답표와 일치한다", async () => {
    await runAcadJob("2026-03", "MANUAL");

    const sync = await runPayJob("2026-03", "MANUAL");
    expect(sync.status).toBe("PARTIAL");

    const rows = await getPayments({ ym: "2026-03" });

    expect(rows).toHaveLength(11);

    // 전체 지급액 970만 원
    const totalPaid = rows.reduce(
      (sum, row) => sum + row.totalPaid,
      0
    );

    expect(totalPaid).toBe(9_700_000);

    // 모든 학생의 CHK-04 일치
    expect(rows.every((row) => row.chk04.ok)).toBe(true);

    // S02: 기준금액 80만 원, 지급액 50만 원
    const s02 = rows.find(
      (row) => row.studentNo === "2025110002"
    );

    expect(s02).toBeDefined();
    expect(s02?.standardAmount).toBe(800_000);
    expect(s02?.totalPaid).toBe(500_000);
    expect(s02?.meets).toBe("X");
    expect(s02?.shortageAmount).toBe(300_000);

    // S04: 지원자격 X이므로 기준금액 없음
    const s04 = rows.find(
      (row) => row.studentNo === "2024210004"
    );

    expect(s04?.overall).toBe("X");
    expect(s04?.standardAmount).toBeNull();
    expect(s04?.meets).toBeNull();
    expect(s04?.shortageAmount).toBeNull();

    // S05, S11 기준금액 확인
    const s05 = rows.find(
      (row) => row.studentNo === "2025310005"
    );
    const s11 = rows.find(
      (row) => row.studentNo === "2024310011"
    );

    expect(s05?.standardAmount).toBe(800_000);
    expect(s11?.standardAmount).toBe(1_100_000);

    // S10만 CHK-05 불일치
    const mismatches = rows.filter(
      (row) => !row.chk05.ok
    );

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0].studentNo).toBe("2026110010");

    // 원천에만 존재하는 F99 50,000원
    expect(mismatches[0].chk05.diffs).toContainEqual({
      field: "F99",
      ours: 0,
      source: 50_000,
    });
  });

  it("2026년 4월 S08은 미지급이므로 전 재원 0원이다", async () => {
    await runAcadJob("2026-04", "MANUAL");

    const sync = await runPayJob("2026-04", "MANUAL");
    expect(sync.status).toBe("SUCCESS");

    const rows = await getPayments({ ym: "2026-04" });

    const s08 = rows.find(
      (row) => row.studentNo === "2025210008"
    );

    expect(s08).toBeDefined();

    expect(Object.values(s08!.fundAmounts).every(
      (amount) => amount === 0
    )).toBe(true);

    expect(s08?.totalPaid).toBe(0);
    expect(s08?.shortageAmount).toBe(1_100_000);
    expect(s08?.chk04.ok).toBe(true);
    expect(s08?.chk05.ok).toBe(true);
  });

  it("원천 지급액 변경을 감지하고 재연동 후 일치로 돌아온다", async () => {
    const ym = "2026-03";
    const studentNo = "2025110009";

    await runAcadJob(ym, "MANUAL");
    await runPayJob(ym, "MANUAL");

    // S09의 F12 원천 지급액을 80만 원에서 70만 원으로 변경
    await db
      .update(srcPayment)
      .set({ amount: 700_000 })
      .where(
        and(
          eq(srcPayment.baseYm, ym),
          eq(srcPayment.studentNo, studentNo),
          eq(srcPayment.fundCode, "F12")
        )
      );

    // 재연동 전: 원천과 본 시스템 불일치
    const before = await getPayments({ ym });

    const s09Before = before.find(
      (row) => row.studentNo === studentNo
    );

    expect(s09Before?.chk05.ok).toBe(false);

    expect(s09Before?.chk05.diffs).toContainEqual({
      field: "F12",
      ours: 800_000,
      source: 700_000,
    });

    // 지급 연동 재실행
    await runPayJob(ym, "MANUAL");

    const after = await getPayments({ ym });
    const s09After = after.find(
      (row) => row.studentNo === studentNo
    );

    expect(s09After?.fundAmounts.F12).toBe(700_000);
    expect(s09After?.shortageAmount).toBe(100_000);
    expect(s09After?.chk05.ok).toBe(true);
  });
});
