
import { eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  payment,
  srcPayment,
} from "@/db/schema";

import { getRoster } from "@/queries/roster";
import { diffFields } from "@/domain/checks";
import type { CheckResult } from "@/domain/checks";

import {
  meetsStandard,
  shortage,
} from "@/domain/amount";

// 화면에 표시할 7개 재원
export const FUND_CODES = [
  "F11",
  "F12",
  "F13",
  "F20",
  "F30",
  "F40",
  "F90",
] as const;

export type FundCode = (typeof FUND_CODES)[number];

type RosterRow =
  Awaited<ReturnType<typeof getRoster>>[number];

export type PaymentFilter = {
  ym: string;
  advisor?: string;
  meets?: "O" | "X";
  q?: string;
};

export type PaymentRow = RosterRow & {
  fundAmounts: Record<FundCode, number>;
  integratedSubtotal: number;
  totalPaid: number;
  meets: "O" | "X" | null;
  shortageAmount: number | null;
  chk04: CheckResult;
  chk05: CheckResult;
};

// 재원별 금액 초기화
function emptyFunds(): Record<FundCode, number> {
  return {
    F11: 0,
    F12: 0,
    F13: 0,
    F20: 0,
    F30: 0,
    F40: 0,
    F90: 0,
  };
}

// 학생번호와 재원코드를 결합한 키
function makeKey(
  studentNo: string,
  fundCode: string
): string {
  return `${studentNo}::${fundCode}`;
}

/**
 * 학생별 지급내역 조회
 *
 * CHK-04:
 * 화면의 재원별 합계 vs SQL SUM 총지급액
 *
 * CHK-05:
 * 본 시스템의 재원별 금액 vs 원천의 재원별 금액
 */
export async function getPayments(
  filter: PaymentFilter
): Promise<PaymentRow[]> {
  const ym = filter.ym;

  // 1. 기준월의 학생 및 지원요건 정보
  const students = await getRoster({ ym });

  // 2. 본 시스템의 학생×재원별 지급 합계
  const fundTotals = await db
    .select({
      studentNo: payment.studentNo,
      fundCode: payment.fundCode,
      total: sql<number>`
        coalesce(sum(${payment.amount}), 0)
      `,
    })
    .from(payment)
    .where(eq(payment.baseYm, ym))
    .groupBy(
      payment.studentNo,
      payment.fundCode
    );

  // 3. SQL SUM으로 학생별 총지급액 별도 계산
  const studentTotals = await db
    .select({
      studentNo: payment.studentNo,
      total: sql<number>`
        coalesce(sum(${payment.amount}), 0)
      `,
    })
    .from(payment)
    .where(eq(payment.baseYm, ym))
    .groupBy(payment.studentNo);

  // 4. 원천 지급 데이터 조회
  const sourceRows = await db
    .select()
    .from(srcPayment)
    .where(eq(srcPayment.baseYm, ym));

  // 5. 재원별 금액을 Map에 정리
  const fundMap = new Map<string, number>();

  for (const row of fundTotals) {
    fundMap.set(
      makeKey(row.studentNo, row.fundCode),
      Number(row.total)
    );
  }

  // 6. 학생별 총지급액 Map
  const totalMap = new Map<string, number>();

  for (const row of studentTotals) {
    totalMap.set(row.studentNo, Number(row.total));
  }

  // 7. 원천 지급 데이터 Map
  // 학번이 존재하는 모든 행을 포함한다.
  // F99 같은 잘못된 재원코드도 제외하지 않는다.
  const sourceMap = new Map<string, number>();
  const sourceCodes = new Map<string, Set<string>>();

  for (const row of sourceRows) {
    if (!row.studentNo || !row.fundCode) {
      continue;
    }

    const key = makeKey(
      row.studentNo,
      row.fundCode
    );

    sourceMap.set(
      key,
      (sourceMap.get(key) ?? 0) +
        (row.amount ?? 0)
    );

    if (!sourceCodes.has(row.studentNo)) {
      sourceCodes.set(row.studentNo, new Set());
    }

    sourceCodes
      .get(row.studentNo)!
      .add(row.fundCode);
  }

  const rows: PaymentRow[] = [];

  // 8. 학생별 지급내역 생성
  for (const student of students) {
    const studentNo = student.studentNo;

    // 8-1. 재원별 지급액
    const fundAmounts = emptyFunds();

    for (const code of FUND_CODES) {
      fundAmounts[code] =
        fundMap.get(makeKey(studentNo, code)) ?? 0;
    }

    // 8-2. 통합관리 재원 소계
    const integratedSubtotal =
      fundAmounts.F11 +
      fundAmounts.F12 +
      fundAmounts.F13;

    // 8-3. SQL로 계산한 실제 총지급액
    const totalPaid = totalMap.get(studentNo) ?? 0;

    // 8-4. 기준금액 충족 및 부족금액
    const meets = meetsStandard(
      student.standardAmount,
      totalPaid
    );

    const shortageAmount = shortage(
      student.standardAmount,
      totalPaid
    );

    // 9. CHK-04: 재원별 합계와 총지급액 비교
    const fundSum = FUND_CODES.reduce(
      (sum, code) => sum + fundAmounts[code],
      0
    );

    const chk04 = diffFields(
      { totalPaid: fundSum },
      { totalPaid },
      ["totalPaid"]
    );

    // 10. CHK-05: 원천 지급액과 비교
    // 정상 재원뿐 아니라 원천의 잘못된 코드도 포함
    const allCodes = new Set<string>(FUND_CODES);

    for (
      const code of sourceCodes.get(studentNo) ?? []
    ) {
      allCodes.add(code);
    }

    for (const row of fundTotals) {
      if (row.studentNo === studentNo) {
        allCodes.add(row.fundCode);
      }
    }

    const differences: CheckResult["diffs"] = [];

    for (const code of [...allCodes].sort()) {
      const ours =
        fundMap.get(makeKey(studentNo, code)) ?? 0;

      const source =
        sourceMap.get(makeKey(studentNo, code)) ?? 0;

      if (ours !== source) {
        differences.push({
          field: code,
          ours,
          source,
        });
      }
    }

    const chk05: CheckResult = {
      ok: differences.length === 0,
      diffs: differences,
      ...(differences.some(
        (d) => d.ours === 0 && Number(d.source) > 0
      )
        ? { note: "본 시스템에 없는 원천 지급내역이 있습니다." }
        : {}),
    };

    rows.push({
      ...student,
      fundAmounts,
      integratedSubtotal,
      totalPaid,
      meets,
      shortageAmount,
      chk04,
      chk05,
    });
  }

  // 11. 필터 적용
  const q = filter.q?.trim().toLowerCase();

  return rows
    .filter((row) => {
      if (
        filter.advisor &&
        row.advisorId !== filter.advisor
      ) {
        return false;
      }

      if (
        filter.meets &&
        row.meets !== filter.meets
      ) {
        return false;
      }

      if (
        q &&
        !row.name.toLowerCase().includes(q) &&
        !row.studentNo.toLowerCase().includes(q)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) =>
      a.studentNo.localeCompare(b.studentNo)
    );
}
