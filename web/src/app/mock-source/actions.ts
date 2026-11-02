
"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/authorization";
import { db } from "@/db/client";
import {
  srcAcademicMonthly,
  srcPayment,
} from "@/db/schema";

function valueOf(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function resultUrl(
  table: "academic" | "payment",
  ym: string,
  message: string
) {
  const params = new URLSearchParams({
    table,
    ym,
    message,
  });

  return `/mock-source?${params.toString()}`;
}

// Mock 학적 원천 수정
export async function updateAcademicSource(
  formData: FormData
) {
  // 관리자 권한 검사
  await requireAdmin();

  const srcId = valueOf(formData, "srcId");
  const ym = valueOf(formData, "ym");
  const dept = valueOf(formData, "dept");
  const degree = valueOf(formData, "degree");

  if (!srcId || !dept || !degree) {
    redirect(
      resultUrl("academic", ym, "필수값을 입력해 주세요.")
    );
  }

  const existing = await db
    .select()
    .from(srcAcademicMonthly)
    .where(eq(srcAcademicMonthly.srcId, srcId))
    .limit(1);

  if (existing.length === 0) {
    redirect(
      resultUrl("academic", ym, "원천 행을 찾을 수 없습니다.")
    );
  }

  await db
    .update(srcAcademicMonthly)
    .set({
      dept,
      degree,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(srcAcademicMonthly.srcId, srcId));

  // 원천 테이블은 외부 시스템 역할이므로
  // 여기서는 audit_log를 기록하지 않는다.
  revalidatePath("/mock-source");

  redirect(
    resultUrl(
      "academic",
      ym,
      "학적 원천 수정 완료. JOB-ACAD를 실행해야 반영됩니다."
    )
  );
}

// Mock 지급 원천 수정
export async function updatePaymentSource(
  formData: FormData
) {
  // 관리자 권한 검사
  await requireAdmin();

  const srcId = valueOf(formData, "srcId");
  const ym = valueOf(formData, "ym");
  const fundCode = valueOf(formData, "fundCode");
  const amountText = valueOf(formData, "amount");

  // 입력한 금액을 숫자로 변환
  const amount = Number(amountText);

  if (
    !srcId ||
    !fundCode ||
    amountText === "" ||
    !Number.isSafeInteger(amount) ||
    amount < 0
  ) {
    redirect(
      resultUrl(
        "payment",
        ym,
        "재원 코드와 0 이상의 정수 금액을 입력해 주세요."
      )
    );
  }

  const existing = await db
    .select()
    .from(srcPayment)
    .where(eq(srcPayment.srcId, srcId))
    .limit(1);

  if (existing.length === 0) {
    redirect(
      resultUrl("payment", ym, "원천 행을 찾을 수 없습니다.")
    );
  }

  await db
    .update(srcPayment)
    .set({
      fundCode,
      amount,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(srcPayment.srcId, srcId));

  revalidatePath("/mock-source");

  redirect(
    resultUrl(
      "payment",
      ym,
      "지급 원천 수정 완료. JOB-PAY를 실행해야 반영됩니다."
    )
  );
}
