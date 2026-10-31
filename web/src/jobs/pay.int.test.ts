
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { seedAll } from "@/db/seed";

import {
  payment,
  srcPayment,
  syncLog,
  syncError,
  notification,
  auditLog,
} from "@/db/schema";

import { runAcadJob } from "./acad";
import { runPayJob } from "./pay";

describe("JOB-PAY 지급 연동", () => {
  beforeEach(async () => {
    await seedAll();
  });

  it("2026년 3월 지급 17건 중 15건을 정상 연동한다", async () => {
    // 지급 연동 전에 학생 명부 생성
    const acad = await runAcadJob("2026-03", "MANUAL");
    expect(acad.status).toBe("SUCCESS");

    // 지급 연동
    const result = await runPayJob("2026-03", "MANUAL");

    expect(result.status).toBe("PARTIAL");

    const [log] = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.syncId, result.syncId));

    expect(log.readCnt).toBe(17);
    expect(log.okCnt).toBe(15);
    expect(log.errCnt).toBe(2);

    // 정상 지급내역 15건
    const payments = await db
      .select()
      .from(payment)
      .where(eq(payment.baseYm, "2026-03"));

    expect(payments).toHaveLength(15);

    // 원천 데이터 오류 2건 검증
    const errors = await db
      .select()
      .from(syncError)
      .where(eq(syncError.syncId, result.syncId));

    expect(errors).toHaveLength(2);

    expect(
      errors.some(
        (e) =>
          e.srcRefId === "PAY-ERR-1" &&
          e.errorCode === "E_REQUIRED"
      )
    ).toBe(true);

    expect(
      errors.some(
        (e) =>
          e.srcRefId === "PAY-ERR-2" &&
          e.errorCode === "E_CODE"
      )
    ).toBe(true);

    // 오류 발생 시 관리자 알림 1건
    const alerts = await db
      .select()
      .from(notification)
      .where(eq(notification.type, "SYNC_ALERT"));

    expect(alerts).toHaveLength(1);
  });

  it("2026년 4월 지급 14건을 모두 정상 연동한다", async () => {
    const acad = await runAcadJob("2026-04", "MANUAL");
    expect(acad.status).toBe("SUCCESS");

    const result = await runPayJob("2026-04", "MANUAL");
    expect(result.status).toBe("SUCCESS");

    const [log] = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.syncId, result.syncId));

    expect(log.readCnt).toBe(14);
    expect(log.okCnt).toBe(14);
    expect(log.errCnt).toBe(0);

    const payments = await db
      .select()
      .from(payment)
      .where(eq(payment.baseYm, "2026-04"));

    expect(payments).toHaveLength(14);

    // S08은 4월 지급내역이 없어야 함
    const s08Payments = payments.filter(
      (p) => p.studentNo === "2025210008"
    );

    expect(s08Payments).toHaveLength(0);
  });
  
  it("학적 연동 없이 지급 연동하면 17건 모두 E_REF 오류가 발생한다", async () => {
    // 학생 명부를 생성하지 않고 지급 연동 실행
    const result = await runPayJob("2026-03", "MANUAL");

    expect(result.status).toBe("PARTIAL");

    const [log] = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.syncId, result.syncId));

    expect(log.readCnt).toBe(17);
    expect(log.okCnt).toBe(0);
    expect(log.errCnt).toBe(17);

    // 실제 지급내역은 생성되지 않아야 함
    const payments = await db
      .select()
      .from(payment)
      .where(eq(payment.baseYm, "2026-03"));

    expect(payments).toHaveLength(0);

    // 오류 기록 17건 확인
    const errors = await db
      .select()
      .from(syncError)
      .where(eq(syncError.syncId, result.syncId));

    expect(errors).toHaveLength(17);
  });

  it("같은 월 지급 연동을 두 번 실행해도 감사로그가 중복되지 않는다", async () => {
    await runAcadJob("2026-04", "MANUAL");

    // 첫 번째 지급 연동
    const first = await runPayJob("2026-04", "MANUAL");
    expect(first.status).toBe("SUCCESS");

    const auditsBefore = await db.select().from(auditLog);

    // 두 번째 지급 연동
    const second = await runPayJob("2026-04", "MANUAL");
    expect(second.status).toBe("SUCCESS");

    const auditsAfter = await db.select().from(auditLog);

    expect(auditsAfter.length - auditsBefore.length).toBe(0);
  });
  
  it("원천 지급행을 삭제하면 지급내역과 감사로그 D가 반영된다", async () => {
    const baseYm = "2026-04";

    // 1. 학적 및 지급 데이터 최초 연동
    const acad = await runAcadJob(baseYm, "MANUAL");
    expect(acad.status).toBe("SUCCESS");

    const first = await runPayJob(baseYm, "MANUAL");
    expect(first.status).toBe("SUCCESS");

    // 2. 실제 저장된 지급내역 14건 확인
    const initialPayments = await db
      .select()
      .from(payment)
      .where(eq(payment.baseYm, baseYm));

    expect(initialPayments).toHaveLength(14);

    // 삭제할 원천 ID를 저장
    const target = initialPayments[0];
    const targetSrcId = target.srcRefId;

    // 3. 원천 지급 데이터에서 1건 삭제
    await db
      .delete(srcPayment)
      .where(eq(srcPayment.srcId, targetSrcId));

    // 4. 두 번째 지급 연동
    const second = await runPayJob(baseYm, "MANUAL");
    expect(second.status).toBe("SUCCESS");

    // 5. 지급내역이 13건으로 줄었는지 확인
    const remainingPayments = await db
      .select()
      .from(payment)
      .where(eq(payment.baseYm, baseYm));

    expect(remainingPayments).toHaveLength(13);

    // 삭제한 원천 ID의 지급내역이 없어야 함
    const [deletedPayment] = await db
      .select()
      .from(payment)
      .where(eq(payment.srcRefId, targetSrcId));

    expect(deletedPayment).toBeUndefined();

    // 6. 삭제 감사로그 확인
    const audits = await db.select().from(auditLog);

    const deleteAudits = audits.filter(
      (audit) =>
        audit.tableName === "payment" &&
        audit.rowKey === targetSrcId &&
        audit.action === "D"
    );

    expect(deleteAudits).toHaveLength(1);

    // 7. 삭제 전 데이터가 감사로그에 남아 있는지 확인
    const before = JSON.parse(deleteAudits[0].beforeJson!);

    expect(before.srcRefId).toBe(targetSrcId);
    expect(before.amount).toBe(target.amount);
  });


});
