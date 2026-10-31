
import { beforeEach, describe, expect, it } from "vitest";
import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db/client";
import { seedAll } from "@/db/seed";

import {
  accountLedger,
  auditLog,
  syncLog,
  syncError,
} from "@/db/schema";

import { runAcctJob } from "./acct";

describe("JOB-ACCT 기관계정 연동", () => {
  beforeEach(async () => {
    await seedAll();
  });

  // 테스트 1: 전체 기간 연동
  it("2026년 1월부터 6월까지 거래 9건을 정상 연동한다", async () => {
    const result = await runAcctJob(
      "2026-01-01",
      "2026-06-30",
      "MANUAL"
    );

    expect(result.status).toBe("SUCCESS");

    // 연동 실행 이력 확인
    const [log] = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.syncId, result.syncId));

    expect(log).toBeDefined();
    expect(log.jobCode).toBe("JOB-ACCT");
    expect(log.target).toBe("2026-01-01~2026-06-30");
    expect(log.readCnt).toBe(9);
    expect(log.okCnt).toBe(9);
    expect(log.errCnt).toBe(0);

    // 원장에 거래 9건 저장 확인
    const transactions = await db
      .select()
      .from(accountLedger);

    expect(transactions).toHaveLength(9);

    // 연동 오류가 없어야 함
    const errors = await db
      .select()
      .from(syncError)
      .where(eq(syncError.syncId, result.syncId));

    expect(errors).toHaveLength(0);

    // 신규 거래 9건의 생성 감사로그 확인
    const audits = await db
      .select()
      .from(auditLog);

    const created = audits.filter(
      (a) =>
        a.tableName === "account_ledger" &&
        a.action === "C" &&
        a.actor === "SYSTEM:JOB-ACCT"
    );

    expect(created).toHaveLength(9);
  });

  // 테스트 2: 3월 거래만 연동
  it("2026년 3월 거래 5건만 정상 연동한다", async () => {
    const result = await runAcctJob(
      "2026-03-01",
      "2026-03-31",
      "MANUAL"
    );

    expect(result.status).toBe("SUCCESS");

    const [log] = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.syncId, result.syncId));

    expect(log.readCnt).toBe(5);
    expect(log.okCnt).toBe(5);
    expect(log.errCnt).toBe(0);

    // 3월 거래 조회
    const transactions = await db
      .select()
      .from(accountLedger)
      .where(
        and(
          gte(accountLedger.txnDate, "2026-03-01"),
          lte(accountLedger.txnDate, "2026-03-31")
        )
      );

    expect(transactions).toHaveLength(5);

    // README에서 지정한 3월 거래 ID 5개
    const expectedIds = [
      "TXN-0002",
      "TXN-0003",
      "TXN-0004",
      "TXN-0102",
      "TXN-0103",
    ];

    const actualIds = transactions
      .map((t) => t.srcRefId)
      .sort();

    expect(actualIds).toEqual(expectedIds.sort());

    // 다른 월의 거래는 등록되지 않아야 함
    const allTransactions = await db
      .select()
      .from(accountLedger);

    expect(allTransactions).toHaveLength(5);
  });

  // 테스트 3: 동일 기간 재실행
  it("같은 기간을 두 번 연동해도 감사로그가 중복되지 않는다", async () => {
    const first = await runAcctJob(
      "2026-01-01",
      "2026-06-30",
      "MANUAL"
    );

    expect(first.status).toBe("SUCCESS");

    const auditsBefore = await db.select().from(auditLog);

    const second = await runAcctJob(
      "2026-01-01",
      "2026-06-30",
      "MANUAL"
    );

    expect(second.status).toBe("SUCCESS");

    const auditsAfter = await db.select().from(auditLog);

    expect(auditsAfter.length - auditsBefore.length).toBe(0);

    // 원장 데이터도 9건 그대로 유지
    const transactions = await db
      .select()
      .from(accountLedger);

    expect(transactions).toHaveLength(9);
  });
});
