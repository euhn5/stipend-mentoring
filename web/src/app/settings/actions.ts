
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { ruleConfig } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import {
  ACAD_STATUSES,
  ACTIVITY_TYPES,
} from "@/lib/codes";

export async function saveRuleConfig(
  formData: FormData
): Promise<void> {
  const key = String(formData.get("key") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();

  if (!key || !value) {
    throw new Error("설정 항목과 값을 입력해 주세요.");
  }

  // 예상하지 못한 설정 항목은 수정하지 않는다.
  const [existing] = await db
    .select()
    .from(ruleConfig)
    .where(eq(ruleConfig.key, key))
    .limit(1);

  if (!existing) {
    throw new Error("등록되지 않은 기준정보입니다.");
  }

  // 설정 항목별 값 검증
  if (key === "eligible.acad_status") {
    if (!ACAD_STATUSES.some((status) => status === value)) {
      throw new Error("올바르지 않은 학적상태입니다.");
    }
  } else if (key === "eligible.fulltime_yn") {
    if (value !== "Y" && value !== "N") {
      throw new Error("전일제 여부는 Y 또는 N이어야 합니다.");
    }
  } else if (key === "eligible.activity_types") {
    const types = value.split(",").map((item) => item.trim());

    if (
      types.length === 0 ||
      types.some(
        (type) =>
          !type ||
          !ACTIVITY_TYPES.some(
            (allowed) => allowed === type
          )
      ) ||
      new Set(types).size !== types.length
    ) {
      throw new Error(
        "연구활동 유형은 등록된 코드만 쉼표로 구분해 입력하세요."
      );
    }
  } else {
    // 지원 개월 수, 기준금액, 학기 경계값은 양의 정수
    if (
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) <= 0
    ) {
      throw new Error("이 항목은 1 이상의 정수여야 합니다.");
    }
  }

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(ruleConfig)
      .where(eq(ruleConfig.key, key))
      .limit(1);

    if (!current) {
      throw new Error("기준정보를 찾을 수 없습니다.");
    }

    // 값이 같으면 변경 및 감사로그 생략
    if (current.value === value) {
      return;
    }

    await tx
      .update(ruleConfig)
      .set({ value })
      .where(eq(ruleConfig.key, key));

    await recordAudit(tx, {
      tableName: "rule_config",
      rowKey: key,
      action: "U",
      before: current,
      after: {
        ...current,
        value,
      },
      actor: "admin",
    });
  });

  revalidatePath("/settings");
  revalidatePath("/audit");
}
