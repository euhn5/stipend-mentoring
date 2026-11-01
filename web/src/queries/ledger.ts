
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { diffFields } from "@/domain/checks";
import type { CheckResult } from "@/domain/checks";

export type LedgerFilter = {
  accountId: string;
  from: string;
  to: string;
};

export type LedgerRow = {
  txnId: number;
  txnDate: string;
  direction: string;
  itemCode: string;
  sourceItem: string;
  amount: number;
  memo: string | null;
  signedAmount: number;
  balance: number;
};

export type OpeningBalance = {
  sourceItem: string;
  inTotal: number;
  outTotal: number;
  balance: number;
};

/**
 * 날짜 범위와 계정 ID 검사
 */
function validateFilter(filter: LedgerFilter) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!filter.accountId.trim()) {
    throw new Error("기관계정 ID가 필요합니다.");
  }

  if (
    !datePattern.test(filter.from) ||
    !datePattern.test(filter.to) ||
    filter.from > filter.to
  ) {
    throw new Error("올바른 조회 기간을 입력해 주세요.");
  }
}

/**
 * 거래 원장 조회
 *
 * 누적잔액은 출처별로 계산한다.
 * 윈도우 함수로 전체 과거 거래를 먼저 계산한 뒤
 * 사용자가 선택한 날짜 범위를 적용한다.
 */
export async function getLedgerRows(
  filter: LedgerFilter
): Promise<LedgerRow[]> {
  validateFilter(filter);

  const rows = await db.all<{
    txnId: number;
    txnDate: string;
    direction: string;
    itemCode: string;
    sourceItem: string;
    amount: number;
    memo: string | null;
    signedAmount: number;
    balance: number;
  }>(sql`
    WITH running_ledger AS (
      SELECT
        txn_id AS txnId,
        txn_date AS txnDate,
        direction,
        item_code AS itemCode,
        source_item AS sourceItem,
        amount,
        memo,

        CASE
          WHEN direction = 'IN' THEN amount
          ELSE -amount
        END AS signedAmount,

        SUM(
          CASE
            WHEN direction = 'IN' THEN amount
            ELSE -amount
          END
        ) OVER (
          PARTITION BY source_item
          ORDER BY txn_date, txn_id
          ROWS BETWEEN UNBOUNDED PRECEDING
          AND CURRENT ROW
        ) AS balance

      FROM account_ledger

      WHERE account_id = ${filter.accountId}
        AND txn_date <= ${filter.to}
    )

    SELECT *
    FROM running_ledger
    WHERE txnDate >= ${filter.from}
    ORDER BY txnDate ASC, txnId ASC
  `);

  return rows;
}

/**
 * 조회 시작일 직전까지의 출처별 기초잔액
 *
 * 예: from=2026-04-01 이라면
 * 2026-03-31까지 발생한 모든 거래를 집계한다.
 */
export async function getOpeningBalances(
  filter: LedgerFilter
): Promise<OpeningBalance[]> {
  validateFilter(filter);

  return db.all<OpeningBalance>(sql`
    SELECT
      source_item AS sourceItem,

      COALESCE(
        SUM(
          CASE
            WHEN direction = 'IN' THEN amount
            ELSE 0
          END
        ), 0
      ) AS inTotal,

      COALESCE(
        SUM(
          CASE
            WHEN direction = 'OUT' THEN amount
            ELSE 0
          END
        ), 0
      ) AS outTotal,

      COALESCE(
        SUM(
          CASE
            WHEN direction = 'IN' THEN amount
            ELSE -amount
          END
        ), 0
      ) AS balance

    FROM account_ledger

    WHERE account_id = ${filter.accountId}
      AND txn_date < ${filter.from}

    GROUP BY source_item
    ORDER BY source_item
  `);
}


export type SourceSummary = {
  sourceItem: string;
  inTotal: number;
  outTotal: number;
  balance: number;
  chk06: CheckResult;
  chk07: CheckResult;
};

export type AccountSummary = {
  accountId: string;
  reportDate: string | null;
  carryAmount: number;
  currentYearIncome: number;
  interestIncome: number;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  sources: SourceSummary[];
  chk06: CheckResult;
  chk07: CheckResult;
  chk08: CheckResult;
};

/**
 * 기관계정 수입·지급 요약 및 CHK-06~08 검증
 *
 * 가장 최근 회계 보고 기준일까지의 누적 거래를 사용한다.
 * 화면의 조회 시작일·종료일과는 독립적으로 검증한다.
 */
export async function getAccountSummary(
  accountId: string
): Promise<AccountSummary> {
  if (!accountId.trim()) {
    throw new Error("기관계정 ID가 필요합니다.");
  }

  // 1. 가장 최근 회계 보고 기준일
  const latestReports = await db.all<{
    baseDate: string;
  }>(sql`
    SELECT MAX(base_date) AS baseDate
    FROM src_account_summary
    WHERE account_id = ${accountId}
  `);

  const reportDate = latestReports[0]?.baseDate ?? null;

  // 회계 보고가 없으면 정합성 검증 불가
  if (!reportDate) {
    const missing: CheckResult = {
      ok: false,
      diffs: [],
      note: "회계 보고 데이터가 없습니다.",
    };

    return {
      accountId,
      reportDate: null,
      carryAmount: 0,
      currentYearIncome: 0,
      interestIncome: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalBalance: 0,
      sources: [],
      chk06: missing,
      chk07: missing,
      chk08: missing,
    };
  }

  // 2. 보고 기준일까지 원장 출처별 집계
  const ledgerRows = await db.all<{
    sourceItem: string;
    inTotal: number;
    outTotal: number;
  }>(sql`
    SELECT
      source_item AS sourceItem,
      COALESCE(SUM(
        CASE WHEN direction = 'IN'
          THEN amount ELSE 0 END
      ), 0) AS inTotal,
      COALESCE(SUM(
        CASE WHEN direction = 'OUT'
          THEN amount ELSE 0 END
      ), 0) AS outTotal
    FROM account_ledger
    WHERE account_id = ${accountId}
      AND txn_date <= ${reportDate}
    GROUP BY source_item
  `);

  // 3. 최신 회계 보고 데이터
  const reportRows = await db.all<{
    sourceItem: string;
    inTotal: number | null;
    outTotal: number | null;
    balance: number | null;
  }>(sql`
    SELECT
      source_item AS sourceItem,
      in_total AS inTotal,
      out_total AS outTotal,
      balance
    FROM src_account_summary
    WHERE account_id = ${accountId}
      AND base_date = ${reportDate}
  `);

  const ledgerMap = new Map(
    ledgerRows.map((row) => [row.sourceItem, row])
  );

  const reportMap = new Map(
    reportRows.map((row) => [row.sourceItem, row])
  );

  // 원장 또는 보고서 한쪽에만 있는 출처도 검사
  const allSources = new Set([
    ...ledgerMap.keys(),
    ...reportMap.keys(),
  ]);

  const sources: SourceSummary[] = [];

  // 4. 출처별 CHK-06 / CHK-07
  for (const sourceItem of [...allSources].sort()) {
    const ledger = ledgerMap.get(sourceItem);
    const report = reportMap.get(sourceItem);

    const inTotal = Number(ledger?.inTotal ?? 0);
    const outTotal = Number(ledger?.outTotal ?? 0);
    const balance = inTotal - outTotal;

    let chk06: CheckResult;
    let chk07: CheckResult;

    if (!report) {
      chk06 = {
        ok: false,
        diffs: [],
        note: "해당 출처의 회계 보고가 없습니다.",
      };

      chk07 = { ...chk06 };
    } else {
      chk06 = diffFields(
        {
          inTotal,
          outTotal,
        },
        {
          inTotal: report.inTotal,
          outTotal: report.outTotal,
        },
        ["inTotal", "outTotal"]
      );

      chk07 = diffFields(
        { balance },
        { balance: report.balance },
        ["balance"]
      );
    }

    sources.push({
      sourceItem,
      inTotal,
      outTotal,
      balance,
      chk06,
      chk07,
    });
  }

  // 5. 원장 전체 수입·지급 합계
  const totalIncome = sources.reduce(
    (sum, row) => sum + row.inTotal,
    0
  );

  const totalExpense = sources.reduce(
    (sum, row) => sum + row.outTotal,
    0
  );

  const totalBalance = totalIncome - totalExpense;

  // 6. 수입총액 구성
  const carryAmount = sources
    .filter((row) => row.sourceItem === "I_CARRY")
    .reduce((sum, row) => sum + row.inTotal, 0);

  const interestIncome = sources
    .filter((row) => row.sourceItem === "I_INT")
    .reduce((sum, row) => sum + row.inTotal, 0);

  const currentYearIncome =
    totalIncome - carryAmount - interestIncome;

  // 7. CHK-06 / CHK-07 전체 결과
  const chk06: CheckResult = {
    ok: sources.every((row) => row.chk06.ok),
    diffs: sources.flatMap((row) =>
      row.chk06.diffs.map((diff) => ({
        ...diff,
        field: `${row.sourceItem}.${diff.field}`,
      }))
    ),
    ...(
      sources.some((row) => row.chk06.note)
        ? { note: "일부 출처의 회계 보고가 누락되었습니다." }
        : {}
    ),
  };

  const chk07: CheckResult = {
    ok: sources.every((row) => row.chk07.ok),
    diffs: sources.flatMap((row) =>
      row.chk07.diffs.map((diff) => ({
        ...diff,
        field: `${row.sourceItem}.${diff.field}`,
      }))
    ),
    ...(
      sources.some((row) => row.chk07.note)
        ? { note: "일부 출처의 회계 보고가 누락되었습니다." }
        : {}
    ),
  };

  // 8. CHK-08: 원장 전체 잔액 vs 회계 보고 잔액 합계
  const reportedBalance = reportRows.reduce(
    (sum, row) => sum + Number(row.balance ?? 0),
    0
  );

  const chk08 = diffFields(
    { totalBalance },
    { totalBalance: reportedBalance },
    ["totalBalance"]
  );

  return {
    accountId,
    reportDate,
    carryAmount,
    currentYearIncome,
    interestIncome,
    totalIncome,
    totalExpense,
    totalBalance,
    sources,
    chk06,
    chk07,
    chk08,
  };
}
