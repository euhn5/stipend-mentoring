
import { and } from "drizzle-orm";
import { loadRules } from "@/lib/rules";
import { countCumSupportMonths, judge } from "@/domain/eligibility";
import { addMonths } from "@/domain/month";
import { createNotification } from "@/lib/notify";
import { runJob } from "./run";
import type { Trigger, JobResult } from "./run";

import {
  srcAcademicMonthly,
  srcResearchHistory,
  studentMonthly,
  eligibilityResult,
} from "@/db/schema";

import {
  DEGREES,
  ACAD_STATUSES,
  ACTIVITY_TYPES,
} from "@/lib/codes";

import { eq } from "drizzle-orm";
import { srcProfessor, professor } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import type { JobContext } from "./run";

/**
 * Mock 원천의 지도교수 정보를 본 시스템에 반영한다.
 */
export async function syncProfessors(ctx: JobContext) {
  const sourceRows = await ctx.tx.select().from(srcProfessor);

  for (const row of sourceRows) {
    // 1. 필수값 검사
    if (
      !row.profId ||
      !row.name ||
      !row.researcherNo ||
      !row.dept
    ) {
      await ctx.error({
        srcTable: "src_professor",
        srcRefId: row.profId ?? "",
        errorCode: "E_REQUIRED",
        message: "지도교수 필수값이 누락되었습니다.",
      });
      continue;
    }

    // 2. 기존 지도교수 확인
    const [existing] = await ctx.tx
      .select()
      .from(professor)
      .where(eq(professor.profId, row.profId));

    const values = {
      profId: row.profId,
      name: row.name,
      researcherNo: row.researcherNo,
      dept: row.dept,
    };

    // 3. 신규 지도교수 추가
    if (!existing) {
      await ctx.tx.insert(professor).values(values);

      await recordAudit(ctx.tx, {
        tableName: "professor",
        rowKey: row.profId,
        action: "C",
        after: values,
        actor: ctx.actor,
      });

      continue;
    }

    // 4. 기존 정보와 비교
    const changed =
      existing.name !== values.name ||
      existing.researcherNo !== values.researcherNo ||
      existing.dept !== values.dept;

    if (!changed) {
      continue;
    }

    // 5. 변경된 정보만 수정
    await ctx.tx
      .update(professor)
      .set(values)
      .where(eq(professor.profId, row.profId));

    await recordAudit(ctx.tx, {
      tableName: "professor",
      rowKey: row.profId,
      action: "U",
      before: existing,
      after: values,
      actor: ctx.actor,
    });
  }
}


type AcademicRow = typeof srcAcademicMonthly.$inferSelect;

type ValidationError = {
  errorCode: "E_REQUIRED" | "E_CODE" | "E_REF" | "E_VALUE";
  message: string;
};

export function validateAcademicRow(
  row: AcademicRow,
  professorIds: Set<string>
): ValidationError | null {
  // 1. 필수값 검사
  if (
    !row.studentNo ||
    !row.name ||
    !row.degree ||
    !row.researcherNo ||
    !row.originUniv ||
    !row.dept ||
    !row.acadStatus ||
    row.semesterNo === null ||
    !row.advisorId ||
    !row.fulltimeYn ||
    !row.activityType
  ) {
    return {
      errorCode: "E_REQUIRED",
      message: "학적 필수값이 누락되었습니다.",
    };
  }

  // 2. 코드 유효성 검사
  if (
    !DEGREES.some((v) => v === row.degree) ||
    !ACAD_STATUSES.some((v) => v === row.acadStatus) ||
    !ACTIVITY_TYPES.some((v) => v === row.activityType) ||
    !["Y", "N"].includes(row.fulltimeYn)
  ) {
    return {
      errorCode: "E_CODE",
      message: "허용되지 않은 학적 코드입니다.",
    };
  }

  // 3. 지도교수 존재 여부
  if (!professorIds.has(row.advisorId)) {
    return {
      errorCode: "E_REF",
      message: "등록되지 않은 지도교수입니다.",
    };
  }

  // 4. 학기차 유효성
  if (row.semesterNo < 1) {
    return {
      errorCode: "E_VALUE",
      message: "학기차는 1 이상이어야 합니다.",
    };
  }

  return null;
}


export async function runAcadJob(
  baseYm: string,
  trigger: Trigger
): Promise<JobResult> {
  const rules = await loadRules();

  return runJob("JOB-ACAD", baseYm, trigger, async (ctx) => {
    const { tx, actor } = ctx;

    // 1. 지도교수 연동
    await syncProfessors(ctx);

    const professors = await tx.select().from(professor);
    const professorIds = new Set(professors.map((p) => p.profId));

    // 2. 기준월의 학적 원천 읽기
    const sourceRows = await tx
      .select()
      .from(srcAcademicMonthly)
      .where(eq(srcAcademicMonthly.baseYm, baseYm));

    const validStudents = new Set<string>();

    for (const row of sourceRows) {
      ctx.read();

      const error = validateAcademicRow(row, professorIds);

      if (error) {
        await ctx.error({
          srcTable: "src_academic_monthly",
          srcRefId: row.srcId,
          errorCode: error.errorCode,
          message: error.message,
        });
        continue;
      }

      const studentNo = row.studentNo!;

      validStudents.add(studentNo);

      const key = and(
        eq(studentMonthly.baseYm, baseYm),
        eq(studentMonthly.studentNo, studentNo)
      );

      // 데이터를 덮어쓰기 전에 이전 상태를 보관
      const [existing] = await tx
        .select()
        .from(studentMonthly)
        .where(key);

      const previousYm = addMonths(baseYm, -1);

      const [previousStudent] = existing
        ? [existing]
        : await tx
            .select()
            .from(studentMonthly)
            .where(
              and(
                eq(studentMonthly.baseYm, previousYm),
                eq(studentMonthly.studentNo, studentNo)
              )
            );

      const [currentResult] = await tx
        .select()
        .from(eligibilityResult)
        .where(
          and(
            eq(eligibilityResult.baseYm, baseYm),
            eq(eligibilityResult.studentNo, studentNo)
          )
        );

      const [previousResult] = currentResult
        ? [currentResult]
        : await tx
            .select()
            .from(eligibilityResult)
            .where(
              and(
                eq(eligibilityResult.baseYm, previousYm),
                eq(eligibilityResult.studentNo, studentNo)
              )
            );

      // 3. 누적지원개월 계산
      const history = await tx
        .select()
        .from(srcResearchHistory)
        .where(eq(srcResearchHistory.studentNo, studentNo));

      const cum = countCumSupportMonths(
        history
          .filter((h) => h.ym !== null)
          .map((h) => ({
            ym: h.ym!,
            activityType: h.activityType ?? "NONE",
          })),
        baseYm,
        rules
      );

      const studentValues = {
        baseYm,
        studentNo,
        name: row.name!,
        degree: row.degree!,
        researcherNo: row.researcherNo!,
        originUniv: row.originUniv!,
        dept: row.dept!,
        acadStatus: row.acadStatus!,
        semesterNo: row.semesterNo!,
        advisorId: row.advisorId!,
        fulltimeYn: row.fulltimeYn!,
        activityType: row.activityType!,
        cumSupportMonths: cum,
      };

      const studentChanged =
        !existing ||
        Object.entries(studentValues).some(
          ([field, value]) =>
            existing[field as keyof typeof existing] !== value
        );

      if (!existing) {
        await tx.insert(studentMonthly).values({
          ...studentValues,
          syncedAt: new Date().toISOString(),
        });

        await recordAudit(tx, {
          tableName: "student_monthly",
          rowKey: `${baseYm}|${studentNo}`,
          action: "C",
          after: studentValues,
          actor,
        });
      } else if (studentChanged) {
        await tx
          .update(studentMonthly)
          .set({
            ...studentValues,
            syncedAt: new Date().toISOString(),
          })
          .where(key);

        await recordAudit(tx, {
          tableName: "student_monthly",
          rowKey: `${baseYm}|${studentNo}`,
          action: "U",
          before: existing,
          after: studentValues,
          actor,
        });
      }

      ctx.ok();

      // 4. 지원요건 판정
      const result = judge(
        {
          baseYm,
          degree: row.degree as Parameters<typeof judge>[0]["degree"],
          acadStatus: row.acadStatus!,
          fulltimeYn: row.fulltimeYn!,
          activityType: row.activityType!,
          semesterNo: row.semesterNo!,
          cumSupportMonths: cum,
        },
        rules
      );

      const resultValues = {
        baseYm,
        studentNo,
        r1Status: result.r1,
        r2Fulltime: result.r2,
        r3Activity: result.r3,
        r4Period: result.r4,
        maxSupportYm: result.maxSupportYm,
        overall: result.overall,
        standardAmount: result.standardAmount,
      };

      const resultChanged =
        !currentResult ||
        Object.entries(resultValues).some(
          ([field, value]) =>
            currentResult[field as keyof typeof currentResult] !== value
        );

      if (!currentResult) {
        await tx.insert(eligibilityResult).values({
          ...resultValues,
          judgedAt: new Date().toISOString(),
        });

        await recordAudit(tx, {
          tableName: "eligibility_result",
          rowKey: `${baseYm}|${studentNo}`,
          action: "C",
          after: resultValues,
          actor,
        });
      } else if (resultChanged) {
        await tx
          .update(eligibilityResult)
          .set({
            ...resultValues,
            judgedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(eligibilityResult.baseYm, baseYm),
              eq(eligibilityResult.studentNo, studentNo)
            )
          );

        await recordAudit(tx, {
          tableName: "eligibility_result",
          rowKey: `${baseYm}|${studentNo}`,
          action: "U",
          before: currentResult,
          after: resultValues,
          actor,
        });
      }

      // 5. 이전 상태와 비교하여 알림 생성
      const link = `/students/${studentNo}?ym=${baseYm}&tab=info`;

      if (
        previousStudent &&
        previousStudent.acadStatus !== row.acadStatus
      ) {
        await createNotification(tx, {
          receiver: "ADMIN",
          type: "ACAD_STATUS_CHANGED",
          title: `${row.name} 학적상태 변경`,
          body: `${studentNo} / ${baseYm}: ${previousStudent.acadStatus} → ${row.acadStatus}`,
          link,
        });
      }

      if (
        previousResult &&
        (
          previousResult.r1Status !== result.r1 ||
          previousResult.r2Fulltime !== result.r2 ||
          previousResult.r3Activity !== result.r3 ||
          previousResult.r4Period !== result.r4
        )
      ) {
        await createNotification(tx, {
          receiver: "ADMIN",
          type: "REQ_DETAIL_CHANGED",
          title: `${row.name} 지원요건 변경`,
          body: `${studentNo} / ${baseYm}: 지원요건 세부 판정 변경`,
          link,
        });
      }

      if (
        previousResult &&
        previousResult.overall !== result.overall
      ) {
        await createNotification(tx, {
          receiver: "ADMIN",
          type: "ELIGIBILITY_CHANGED",
          title: `${row.name} 지원자격 변경`,
          body: `${studentNo} / ${baseYm}: ${previousResult.overall} → ${result.overall}`,
          link,
        });
      }
    }

    // 6. 원천에 없거나 검증에 실패한 기존 학생 삭제
    const existingStudents = await tx
      .select()
      .from(studentMonthly)
      .where(eq(studentMonthly.baseYm, baseYm));

    for (const student of existingStudents) {
      if (validStudents.has(student.studentNo)) continue;

      const key = and(
        eq(eligibilityResult.baseYm, baseYm),
        eq(eligibilityResult.studentNo, student.studentNo)
      );

      const [savedResult] = await tx
        .select()
        .from(eligibilityResult)
        .where(key);

      if (savedResult) {
        await tx.delete(eligibilityResult).where(key);

        await recordAudit(tx, {
          tableName: "eligibility_result",
          rowKey: `${baseYm}|${student.studentNo}`,
          action: "D",
          before: savedResult,
          actor,
        });
      }

      await tx
        .delete(studentMonthly)
        .where(
          and(
            eq(studentMonthly.baseYm, baseYm),
            eq(studentMonthly.studentNo, student.studentNo)
          )
        );

      await recordAudit(tx, {
        tableName: "student_monthly",
        rowKey: `${baseYm}|${student.studentNo}`,
        action: "D",
        before: student,
        actor,
      });
    }
  });
}

