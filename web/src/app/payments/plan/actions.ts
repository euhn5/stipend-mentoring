
"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { paymentPlan } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { getRoster } from "@/queries/roster";
import { FUND_CODES } from "@/queries/payments";

export async function savePaymentPlan(
  formData: FormData
): Promise<void> {
  const ym = String(formData.get("ym") ?? "");
  const studentNo = String(
    formData.get("studentNo") ?? ""
  ).trim();
  const fundCode = String(
    formData.get("fundCode") ?? ""
  );
  const amountText = String(
    formData.get("plannedAmount") ?? ""
  ).trim();

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) {
    throw new Error("기준월이 올바르지 않습니다.");
  }

  if (!studentNo) {
    throw new Error("학번을 입력해 주세요.");
  }

  if (!FUND_CODES.some((code) => code === fundCode)) {
    throw new Error("등록되지 않은 재원 코드입니다.");
  }

  if (!/^\d+$/.test(amountText)) {
    throw new Error("계획금액은 0 이상의 정수여야 합니다.");
  }

  const plannedAmount = Number(amountText);

  if (
    !Number.isSafeInteger(plannedAmount) ||
    plannedAmount < 0
  ) {
    throw new Error("계획금액이 올바르지 않습니다.");
  }

  const students = await getRoster({ ym });

  if (
    !students.some(
      (student) => student.studentNo === studentNo
    )
  ) {
    throw new Error(
      "해당 기준월에 등록되지 않은 학생입니다."
    );
  }

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(paymentPlan)
      .where(
        and(
          eq(paymentPlan.baseYm, ym),
          eq(paymentPlan.studentNo, studentNo),
          eq(paymentPlan.fundCode, fundCode)
        )
      )
      .limit(1);

    const next = {
      baseYm: ym,
      studentNo,
      fundCode,
      plannedAmount,
    };

    // 같은 금액으로 저장하면 중복 기록하지 않음
    if (
      existing &&
      existing.plannedAmount === plannedAmount
    ) {
      return;
    }

    if (existing) {
      await tx
        .update(paymentPlan)
        .set({ plannedAmount })
        .where(
          and(
            eq(paymentPlan.baseYm, ym),
            eq(paymentPlan.studentNo, studentNo),
            eq(paymentPlan.fundCode, fundCode)
          )
        );
    } else {
      await tx.insert(paymentPlan).values(next);
    }

    await recordAudit(tx, {
      tableName: "payment_plan",
      rowKey: `${ym}|${studentNo}|${fundCode}`,
      action: existing ? "U" : "C",
      before: existing ?? null,
      after: next,
      actor: "admin",
    });
  });

  revalidatePath("/payments/plan");
  revalidatePath("/audit");
}
