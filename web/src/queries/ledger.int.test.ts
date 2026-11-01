
import { beforeEach, describe, expect, it } from "vitest";

import { seedAll } from "@/db/seed";
import { runAcctJob } from "@/jobs/acct";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { srcAccountSummary } from "@/db/schema";
import {
  getLedgerRows,
  getOpeningBalances,
  getAccountSummary,
} from "./ledger";

describe("기관계정 원장 조회", () => {
  beforeEach(async () => {
    // 테스트 DB를 초기 상태로 복구
    await seedAll();

    // 2026년 상반기 기관계정 거래 연동
    const result = await runAcctJob(
      "2026-01-01",
      "2026-06-30",
      "MANUAL"
    );

    expect(result.status).toBe("SUCCESS");
  });

  it("A01의 전체 거래와 I_GOV 누적잔액을 정확히 계산한다", async () => {
    const rows = await getLedgerRows({
      accountId: "A01",
      from: "2026-01-01",
      to: "2026-06-30",
    });

    // A01의 거래는 총 6건
    expect(rows).toHaveLength(6);

    // I_GOV 출처의 거래만 추출
    const govRows = rows.filter(
      (row) => row.sourceItem === "I_GOV"
    );

    expect(govRows).toHaveLength(3);

    // 3천만 수입 -> 600만 지급 -> 600만 지급
    expect(govRows.map((row) => row.balance)).toEqual([
      30_000_000,
      24_000_000,
      18_000_000,
    ]);

    // 지급 거래는 음수로 계산
    expect(
      govRows.map((row) => row.signedAmount)
    ).toEqual([
      30_000_000,
      -6_000_000,
      -6_000_000,
    ]);
  });

  it("4월부터 조회해도 이전 거래를 반영한 기초잔액이 나온다", async () => {
    const filter = {
      accountId: "A01",
      from: "2026-04-01",
      to: "2026-06-30",
    };

    // 조회 시작일 전날까지의 기초잔액
    const opening = await getOpeningBalances(filter);

    const govOpening = opening.find(
      (row) => row.sourceItem === "I_GOV"
    );

    expect(govOpening).toBeDefined();

    // 3월 말: 3천만 수입 - 600만 지급
    expect(govOpening?.inTotal).toBe(30_000_000);
    expect(govOpening?.outTotal).toBe(6_000_000);
    expect(govOpening?.balance).toBe(24_000_000);

    // 4~6월 거래 조회
    const rows = await getLedgerRows(filter);

    expect(rows).toHaveLength(2);

    // 4월 25일 지급 후 I_GOV 잔액
    const aprilPayment = rows.find(
      (row) =>
        row.txnDate === "2026-04-25" &&
        row.sourceItem === "I_GOV"
    );

    expect(aprilPayment?.signedAmount).toBe(-6_000_000);
    expect(aprilPayment?.balance).toBe(18_000_000);

    // 6월 이자 수입
    const interest = rows.find(
      (row) => row.sourceItem === "I_INT"
    );

    expect(interest?.signedAmount).toBe(120_000);
    expect(interest?.balance).toBe(120_000);
  });

  it("A02 계정의 거래와 잔액은 A01과 독립적으로 계산한다", async () => {
    const rows = await getLedgerRows({
      accountId: "A02",
      from: "2026-01-01",
      to: "2026-06-30",
    });

    expect(rows).toHaveLength(3);

    const piRows = rows.filter(
      (row) => row.sourceItem === "I_PI"
    );

    expect(piRows.map((row) => row.balance)).toEqual([
      2_000_000,
      1_200_000,
    ]);

    // A02의 이월금 100만 원 + I_PI 잔액 120만 원
    const finalBalances = new Map<string, number>();

    for (const row of rows) {
      finalBalances.set(row.sourceItem, row.balance);
    }

    const totalBalance = [
      ...finalBalances.values(),
    ].reduce((sum, balance) => sum + balance, 0);

    expect(totalBalance).toBe(2_200_000);
  });
  
  it("A01 수입·지급·잔액 요약과 CHK-06~08이 일치한다", async () => {
    const summary = await getAccountSummary("A01");

    expect(summary.reportDate).not.toBeNull();

    // 수입 구성
    expect(summary.carryAmount).toBe(5_000_000);
    expect(summary.currentYearIncome).toBe(40_000_000);
    expect(summary.interestIncome).toBe(120_000);

    // 전체 수입·지급·잔액
    expect(summary.totalIncome).toBe(45_120_000);
    expect(summary.totalExpense).toBe(12_000_000);
    expect(summary.totalBalance).toBe(33_120_000);

    // 정합성 검사
    expect(summary.chk06.ok).toBe(true);
    expect(summary.chk07.ok).toBe(true);
    expect(summary.chk08.ok).toBe(true);

    // 정부지원금 출처
    const gov = summary.sources.find(
      (row) => row.sourceItem === "I_GOV"
    );

    expect(gov?.inTotal).toBe(30_000_000);
    expect(gov?.outTotal).toBe(12_000_000);
    expect(gov?.balance).toBe(18_000_000);
    expect(gov?.chk06.ok).toBe(true);
    expect(gov?.chk07.ok).toBe(true);
  });

  it("A02도 CHK-06~08이 모두 일치한다", async () => {
    const summary = await getAccountSummary("A02");

    expect(summary.reportDate).not.toBeNull();
    expect(summary.chk06.ok).toBe(true);
    expect(summary.chk07.ok).toBe(true);
    expect(summary.chk08.ok).toBe(true);
  });

  it("I_GOV 보고 잔액을 1원 변경하면 CHK-07·08만 불일치한다", async () => {
    // 변경 전 정상 상태
    const before = await getAccountSummary("A01");

    expect(before.chk06.ok).toBe(true);
    expect(before.chk07.ok).toBe(true);
    expect(before.chk08.ok).toBe(true);

    expect(before.reportDate).not.toBeNull();

    // 원장 데이터가 아니라 회계 보고 잔액만 수정
    await db
      .update(srcAccountSummary)
      .set({ balance: 17_999_999 })
      .where(
        and(
          eq(srcAccountSummary.accountId, "A01"),
          eq(srcAccountSummary.baseDate, before.reportDate!),
          eq(srcAccountSummary.sourceItem, "I_GOV")
        )
      );

    const after = await getAccountSummary("A01");

    // 수입·지급 합계는 변경되지 않았으므로 일치
    expect(after.chk06.ok).toBe(true);

    // 잔액 보고값만 1원 달라졌으므로 불일치
    expect(after.chk07.ok).toBe(false);
    expect(after.chk08.ok).toBe(false);

    const gov = after.sources.find(
      (row) => row.sourceItem === "I_GOV"
    );

    expect(gov?.chk06.ok).toBe(true);
    expect(gov?.chk07.ok).toBe(false);

    expect(gov?.chk07.diffs).toContainEqual({
      field: "balance",
      ours: 18_000_000,
      source: 17_999_999,
    });

    expect(after.chk08.diffs).toContainEqual({
      field: "totalBalance",
      ours: 33_120_000,
      source: 33_119_999,
    });
  });

});
