
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { seedAll } from "@/db/seed";
import {
  studentMonthly,
  eligibilityResult,
  syncLog,
  auditLog,
  notification,
  srcAcademicMonthly,
  syncError,
} from "@/db/schema";
import { runAcadJob } from "./acad";



describe("JOB-ACAD 학적 연동", () => {
  // 각 테스트 전에 초기 데이터 준비
  beforeEach(async () => {
    await seedAll();
  });

  // 테스트 1: 학적 데이터 11건 정상 연동
  it("2026년 3월 학적 11건을 정상 연동한다", async () => {
    const result = await runAcadJob("2026-03", "MANUAL");

    expect(result.status).toBe("SUCCESS");

    const [log] = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.syncId, result.syncId));

    expect(log).toBeDefined();
    expect(log.readCnt).toBe(11);
    expect(log.okCnt).toBe(11);
    expect(log.errCnt).toBe(0);

    const students = await db
      .select()
      .from(studentMonthly)
      .where(eq(studentMonthly.baseYm, "2026-03"));

    const results = await db
      .select()
      .from(eligibilityResult)
      .where(eq(eligibilityResult.baseYm, "2026-03"));

    expect(students).toHaveLength(11);
    expect(results).toHaveLength(11);
  });

  // 테스트 2: 실제 학생별 지원요건 판정 확인
  it("S01, S04, S06의 판정 결과가 정답표와 일치한다", async () => {
    const result = await runAcadJob("2026-03", "MANUAL");

    expect(result.status).toBe("SUCCESS");

    const results = await db
      .select()
      .from(eligibilityResult)
      .where(eq(eligibilityResult.baseYm, "2026-03"));

    const findStudent = (studentNo: string) =>
      results.find((r) => r.studentNo === studentNo);

    // S01: 김민준 — 정상적인 박사과정 학생
    const s01 = findStudent("2023210001");

    expect(s01).toBeDefined();
    expect(s01?.overall).toBe("O");

    // S04: 최수아 — 비전일제 학생
    const s04 = findStudent("2024210004");

    expect(s04).toBeDefined();
    expect(s04?.overall).toBe("X");

    // S06: 강하은 — 지원가능 기한 2026년 5월
    const s06 = findStudent("2025110006");

    expect(s06).toBeDefined();
    expect(s06?.maxSupportYm).toBe("2026-05");
  });

  
  it("같은 월을 두 번 연동해도 감사로그와 알림이 중복되지 않는다", async () => {
    // 첫 번째 연동
    const first = await runAcadJob("2026-03", "MANUAL");
    expect(first.status).toBe("SUCCESS");

    const auditsBefore = await db.select().from(auditLog);
    const notificationsBefore = await db.select().from(notification);

    // 두 번째 연동
    const second = await runAcadJob("2026-03", "MANUAL");
    expect(second.status).toBe("SUCCESS");

    const auditsAfter = await db.select().from(auditLog);
    const notificationsAfter = await db.select().from(notification);

    // 실제 변경이 없으므로 추가 기록이 없어야 한다
    expect(auditsAfter.length - auditsBefore.length).toBe(0);
    expect(notificationsAfter.length - notificationsBefore.length).toBe(0);

    // 두 번째 실행도 정상 처리되어야 한다
    const [log] = await db
      .select()
      .from(syncLog)
      .where(eq(syncLog.syncId, second.syncId));

    expect(log.readCnt).toBe(11);
    expect(log.okCnt).toBe(11);
    expect(log.errCnt).toBe(0);
  });
  
  it("잘못된 학위과정은 E_CODE 오류로 처리한다", async () => {
    const studentNo = "2023210001";

    // 원천 데이터의 학위과정을 잘못된 값으로 변경
    await db
      .update(srcAcademicMonthly)
      .set({ degree: "학사" })
      .where(eq(srcAcademicMonthly.studentNo, studentNo));

    // 학적 연동 실행
    const result = await runAcadJob("2026-03", "MANUAL");

    expect(result.status).toBe("PARTIAL");

    // 오류 기록 확인
    const errors = await db
      .select()
      .from(syncError)
      .where(eq(syncError.syncId, result.syncId));

    expect(errors).toHaveLength(1);
    expect(errors[0].errorCode).toBe("E_CODE");

    // 잘못된 학생이 명부에 등록되지 않았는지 확인
    const students = await db
      .select()
      .from(studentMonthly)
      .where(eq(studentMonthly.studentNo, studentNo));

    const marchStudent = students.find(
      (s) => s.baseYm === "2026-03"
    );

    expect(marchStudent).toBeUndefined();
  });
  
  it("원천 학과 정보가 변경되면 감사로그 U가 기록된다", async () => {
    const studentNo = "2023210001";

    // 1. 첫 번째 학적 연동
    const first = await runAcadJob("2026-03", "MANUAL");
    expect(first.status).toBe("SUCCESS");

    // 2. 원천 데이터의 학과 변경
    await db
      .update(srcAcademicMonthly)
      .set({ dept: "인공지능학과" })
      .where(eq(srcAcademicMonthly.studentNo, studentNo));

    // 3. 두 번째 학적 연동
    const second = await runAcadJob("2026-03", "MANUAL");
    expect(second.status).toBe("SUCCESS");

    // 4. 변경된 학생 데이터 확인
    const students = await db
      .select()
      .from(studentMonthly)
      .where(eq(studentMonthly.baseYm, "2026-03"));

    const student = students.find(
      (s) => s.studentNo === studentNo
    );

    expect(student?.dept).toBe("인공지능학과");

    // 5. 학생 명부의 수정 감사로그 조회
    const audits = await db
      .select()
      .from(auditLog);

    const updateAudits = audits.filter(
      (a) =>
        a.tableName === "student_monthly" &&
        a.rowKey === `2026-03|${studentNo}` &&
        a.action === "U"
    );

    expect(updateAudits).toHaveLength(1);

    // 6. 변경 전후 값 확인
    const audit = updateAudits[0];

    const before = JSON.parse(audit.beforeJson!);
    const after = JSON.parse(audit.afterJson!);

    expect(before.dept).toBe("컴퓨터공학과");
    expect(after.dept).toBe("인공지능학과");
  });
  
  it("3월부터 8월까지 연동하면 학적 알림 5건이 생성된다", async () => {
    const months = [
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
    ];

    // 1. 여섯 개 월을 순서대로 연동
    for (const month of months) {
      const result = await runAcadJob(month, "MANUAL");
      expect(result.status).toBe("SUCCESS");
    }

    // 2. 전체 알림 조회
    const notifications = await db.select().from(notification);

    // 3. 학적 연동 알림만 추출
    const acadNotifications = notifications.filter((n) =>
      [
        "ACAD_STATUS_CHANGED",
        "REQ_DETAIL_CHANGED",
        "ELIGIBILITY_CHANGED",
      ].includes(n.type)
    );

    // 총 5건이어야 함
    expect(acadNotifications).toHaveLength(5);

    // 4. 학생별 알림 유형 확인
    const s03 = acadNotifications.filter((n) =>
      n.body.includes("2025110003")
    );

    const s06 = acadNotifications.filter((n) =>
      n.body.includes("2025110006")
    );

    expect(s03.map((n) => n.type).sort()).toEqual(
      [
        "ACAD_STATUS_CHANGED",
        "REQ_DETAIL_CHANGED",
        "ELIGIBILITY_CHANGED",
      ].sort()
    );

    expect(s06.map((n) => n.type).sort()).toEqual(
      [
        "REQ_DETAIL_CHANGED",
        "ELIGIBILITY_CHANGED",
      ].sort()
    );
  });


});
