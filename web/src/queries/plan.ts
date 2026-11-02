
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { paymentPlan } from "@/db/schema";

import {
  FUND_CODES,
  getPayments,
  type FundCode,
} from "@/queries/payments";

export type PlanRow = {
  studentNo: string;
  name: string;
  fundCode: FundCode;
  plannedAmount: number | null;
  actualAmount: number;
  difference: number | null;
};

export async function getPaymentPlans(
  ym: string
): Promise<PlanRow[]> {
  // 해당 월의 학생별 실지급액
  const payments = await getPayments({ ym });

  // 해당 월의 저장된 지급 계획
  const plans = await db
    .select()
    .from(paymentPlan)
    .where(eq(paymentPlan.baseYm, ym));

  const planMap = new Map<string, number>();

  for (const plan of plans) {
    planMap.set(
      `${plan.studentNo}|${plan.fundCode}`,
      plan.plannedAmount
    );
  }

  const rows: PlanRow[] = [];

  for (const student of payments) {
    for (const fundCode of FUND_CODES) {
      const key = `${student.studentNo}|${fundCode}`;

      const plannedAmount = planMap.get(key) ?? null;
      const actualAmount = student.fundAmounts[fundCode];

      rows.push({
        studentNo: student.studentNo,
        name: student.name,
        fundCode,
        plannedAmount,
        actualAmount,
        difference:
          plannedAmount === null
            ? null
            : actualAmount - plannedAmount,
      });
    }
  }

  return rows;
}
