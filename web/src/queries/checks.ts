
import { getRoster } from "@/queries/roster";
import { getPayments } from "@/queries/payments";
import { getAccountSummary } from "@/queries/ledger";
import type { CheckResult } from "@/domain/checks";

export type CheckCode =
  | "CHK-01"
  | "CHK-02"
  | "CHK-03"
  | "CHK-04"
  | "CHK-05"
  | "CHK-06"
  | "CHK-07"
  | "CHK-08";

export type CheckRow = {
  code: CheckCode;
  category: string;
  target: string;
  targetName: string;
  result: CheckResult;
  detailUrl: string;
};

export type ChecksReport = {
  ym: string;
  accountId: string;
  reportDate: string | null;
  rows: CheckRow[];
  total: number;
  passed: number;
  failed: number;
};

export const CHECK_NAMES: Record<CheckCode, string> = {
  "CHK-01": "학적 원천 일치",
  "CHK-02": "종합판정 일치",
  "CHK-03": "지원요건 재판정",
  "CHK-04": "지급 합계 일치",
  "CHK-05": "지급 원천 일치",
  "CHK-06": "기관계정 수입·지급 일치",
  "CHK-07": "기관계정 잔액 일치",
  "CHK-08": "기관계정 전체 잔액 일치",
};

export async function getChecksReport(
  ym: string,
  accountId: string
): Promise<ChecksReport> {
  const [roster, payments, account] = await Promise.all([
    getRoster({ ym }),
    getPayments({ ym }),
    getAccountSummary(accountId),
  ]);

  const rows: CheckRow[] = [];

  // CHK-01 ~ CHK-03: 학생 학적 및 지원요건
  for (const student of roster) {
    const detailUrl =
      `/students/${encodeURIComponent(student.studentNo)}` +
      `?ym=${encodeURIComponent(ym)}`;

    rows.push({
      code: "CHK-01",
      category: "학생",
      target: student.studentNo,
      targetName: student.name,
      result: student.chk01,
      detailUrl: `${detailUrl}&tab=info`,
    });

    rows.push({
      code: "CHK-02",
      category: "학생",
      target: student.studentNo,
      targetName: student.name,
      result: student.chk02,
      detailUrl: `${detailUrl}&tab=requirements`,
    });

    rows.push({
      code: "CHK-03",
      category: "학생",
      target: student.studentNo,
      targetName: student.name,
      result: student.chk03,
      detailUrl: `${detailUrl}&tab=requirements`,
    });
  }

  // CHK-04 ~ CHK-05: 학생 지급내역
  for (const student of payments) {
    const detailUrl =
      `/students/${encodeURIComponent(student.studentNo)}` +
      `?ym=${encodeURIComponent(ym)}&tab=payments`;

    rows.push({
      code: "CHK-04",
      category: "지급",
      target: student.studentNo,
      targetName: student.name,
      result: student.chk04,
      detailUrl,
    });

    rows.push({
      code: "CHK-05",
      category: "지급",
      target: student.studentNo,
      targetName: student.name,
      result: student.chk05,
      detailUrl,
    });
  }

  // CHK-06 ~ CHK-07: 기관계정 출처별 검사
  const accountUrl =
    `/accounts/${encodeURIComponent(accountId)}` +
    "?from=2026-01-01&to=2026-06-30";

  for (const source of account.sources) {
    rows.push({
      code: "CHK-06",
      category: "기관계정",
      target: source.sourceItem,
      targetName: accountId,
      result: source.chk06,
      detailUrl: accountUrl,
    });

    rows.push({
      code: "CHK-07",
      category: "기관계정",
      target: source.sourceItem,
      targetName: accountId,
      result: source.chk07,
      detailUrl: accountUrl,
    });
  }

  // CHK-08: 기관계정 전체 잔액 검사
  rows.push({
    code: "CHK-08",
    category: "기관계정",
    target: accountId,
    targetName: "전체 잔액",
    result: account.chk08,
    detailUrl: accountUrl,
  });

  // 회계 보고가 없으면 출처별 검사가 실행되지 않으므로
  // CHK-06, CHK-07도 검사 불가로 표시한다.
  if (!account.reportDate) {
    for (const code of ["CHK-06", "CHK-07"] as const) {
      rows.push({
        code,
        category: "기관계정",
        target: accountId,
        targetName: "회계 보고 없음",
        result: code === "CHK-06"
          ? account.chk06
          : account.chk07,
        detailUrl: accountUrl,
      });
    }
  }

  const passed = rows.filter((row) => row.result.ok).length;

  return {
    ym,
    accountId,
    reportDate: account.reportDate,
    rows,
    total: rows.length,
    passed,
    failed: rows.length - passed,
  };
}
