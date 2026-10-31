
import { and, eq } from "drizzle-orm";

import {
  srcPayment,
  payment,
  studentMonthly,
} from "@/db/schema";

import { FUNDS } from "@/lib/codes";
import { recordAudit } from "@/lib/audit";
import { runJob } from "./run";
import type { Trigger, JobResult } from "./run";

/**
 * 지급 원천 데이터의 날짜 형식 검사
 * YYYY-MM-DD 형식만 허용
 */
function isValidDateFormat(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * JOB-PAY: 지급내역 연동
 */
export async function runPayJob(
  baseYm: string,
  trigger: Trigger
): Promise<JobResult> {
  return runJob("JOB-PAY", baseYm, trigger, async (ctx) => {
    const { tx, actor } = ctx;

    // 1. 기준월의 지급 원천 데이터 조회
    const sourceRows = await tx
      .select()
      .from(srcPayment)
      .where(eq(srcPayment.baseYm, baseYm));

    // 검증을 통과한 원천 ID
    const validSourceIds = new Set<string>();

    for (const row of sourceRows) {
      ctx.read();

      // 2-1. 필수값 검사
      if (
        !row.studentNo ||
        !row.fundCode ||
        row.amount === null ||
        row.amount === undefined ||
        !row.paidDate
      ) {
        await ctx.error({
          srcTable: "src_payment",
          srcRefId: row.srcId,
          errorCode: "E_REQUIRED",
          message: "필수 지급정보가 누락되었습니다.",
        });
        continue;
      }

      // 2-2. 재원 코드 검사
      const validFund = FUNDS.some(
        (fund) => fund.code === row.fundCode
      );

      if (!validFund) {
        await ctx.error({
          srcTable: "src_payment",
          srcRefId: row.srcId,
          errorCode: "E_CODE",
          message: `등록되지 않은 재원 코드: ${row.fundCode}`,
        });
        continue;
      }

      // 2-3. 학생 명부 존재 여부 검사
      const [student] = await tx
        .select()
        .from(studentMonthly)
        .where(
          and(
            eq(studentMonthly.baseYm, baseYm),
            eq(studentMonthly.studentNo, row.studentNo)
          )
        );

      if (!student) {
        await ctx.error({
          srcTable: "src_payment",
          srcRefId: row.srcId,
          errorCode: "E_REF",
          message: `학생 명부에 없는 학생: ${row.studentNo}`,
        });
        continue;
      }

      // 2-4. 금액 및 날짜 검사
      if (
        row.amount < 0 ||
        !isValidDateFormat(row.paidDate)
      ) {
        await ctx.error({
          srcTable: "src_payment",
          srcRefId: row.srcId,
          errorCode: "E_VALUE",
          message: "지급금액 또는 지급일자가 올바르지 않습니다.",
        });
        continue;
      }

      // 3. 모든 검증을 통과한 지급내역
      validSourceIds.add(row.srcId);

      const values = {
        baseYm,
        studentNo: row.studentNo,
        fundCode: row.fundCode,
        amount: row.amount,
        paidDate: row.paidDate,
        srcRefId: row.srcId,
      };

      // 기존 지급내역 조회
      const [existing] = await tx
        .select()
        .from(payment)
        .where(eq(payment.srcRefId, row.srcId));

      if (!existing) {
        // 4-1. 신규 지급내역 생성
        await tx.insert(payment).values(values);

        await recordAudit(tx, {
          tableName: "payment",
          rowKey: row.srcId,
          action: "C",
          after: values,
          actor,
        });
      } else {
        // 4-2. 실제 값이 달라졌는지 검사
        const changed =
          existing.baseYm !== values.baseYm ||
          existing.studentNo !== values.studentNo ||
          existing.fundCode !== values.fundCode ||
          existing.amount !== values.amount ||
          existing.paidDate !== values.paidDate;

        if (changed) {
          await tx
            .update(payment)
            .set(values)
            .where(eq(payment.srcRefId, row.srcId));

          await recordAudit(tx, {
            tableName: "payment",
            rowKey: row.srcId,
            action: "U",
            before: existing,
            after: {
              ...existing,
              ...values,
            },
            actor,
          });
        }
      }

      ctx.ok();
    }

    // 5. 원천에 더 이상 존재하지 않는 지급내역 삭제
    const existingPayments = await tx
      .select()
      .from(payment)
      .where(eq(payment.baseYm, baseYm));

    for (const saved of existingPayments) {
      if (validSourceIds.has(saved.srcRefId)) {
        continue;
      }

      await tx
        .delete(payment)
        .where(eq(payment.paymentId, saved.paymentId));

      await recordAudit(tx, {
        tableName: "payment",
        rowKey: saved.srcRefId,
        action: "D",
        before: saved,
        actor,
      });
    }
  });
}
