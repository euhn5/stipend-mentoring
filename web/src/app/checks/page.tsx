
import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { account } from "@/db/schema";

import {
  CHECK_NAMES,
  getChecksReport,
  type CheckCode,
} from "@/queries/checks";

type Props = {
  searchParams: Promise<{
    ym?: string;
    accountId?: string;
    code?: string;
    status?: string;
  }>;
};

const codes = Object.keys(CHECK_NAMES) as CheckCode[];

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default async function ChecksPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const ym = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.ym ?? "")
    ? params.ym!
    : "2026-03";

  const accounts = await db
    .select()
    .from(account)
    .orderBy(asc(account.accountId));

  const accountId =
    accounts.find((item) => item.accountId === params.accountId)
      ?.accountId ??
    accounts.find((item) => item.accountId === "A01")
      ?.accountId ??
    accounts[0]?.accountId;

  if (!accountId) {
    return (
      <main style={{ padding: 32 }}>
        <h1 style={{ fontSize: 28 }}>정합성 점검</h1>
        <p style={{ marginTop: 16 }}>
          등록된 기관계정이 없습니다. 초기 데이터를 확인해 주세요.
        </p>
      </main>
    );
  }

  const report = await getChecksReport(ym, accountId);

  const codeFilter = codes.find((code) => code === params.code);
  const statusFilter =
    params.status === "pass" || params.status === "fail"
      ? params.status
      : "all";

  const rows = report.rows.filter((row) => {
    if (codeFilter && row.code !== codeFilter) return false;
    if (statusFilter === "pass" && !row.result.ok) return false;
    if (statusFilter === "fail" && row.result.ok) return false;
    return true;
  });

  const summary = codes.map((code) => {
    const matching = report.rows.filter((row) => row.code === code);

    return {
      code,
      total: matching.length,
      failed: matching.filter((row) => !row.result.ok).length,
    };
  });

  const inputStyle = {
    background: "#0f172a",
    border: "1px solid #475569",
    color: "#f8fafc",
    borderRadius: 8,
    padding: "10px 12px",
  };

  const cellStyle = {
    padding: 12,
    borderBottom: "1px solid #334155",
    verticalAlign: "top" as const,
  };

  return (
    <main style={{ padding: 32, maxWidth: 1500, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        정합성 점검
      </h1>

      <p style={{ marginTop: 8, color: "#94a3b8" }}>
        본 시스템과 원천 데이터의 CHK-01~08 검증 결과를
        한곳에서 조회합니다.
      </p>

      <section
        style={{
          marginTop: 28,
          border: "1px solid #475569",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>
          조회 조건
        </h2>

        <form
          action="/checks"
          method="get"
          style={{
            display: "flex",
            alignItems: "end",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 18,
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              기준월
            </span>
            <input
              name="ym"
              type="month"
              defaultValue={ym}
              required
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              기관계정
            </span>
            <select
              name="accountId"
              defaultValue={accountId}
              style={inputStyle}
            >
              {accounts.map((item) => (
                <option key={item.accountId} value={item.accountId}>
                  {item.accountId} · {item.accountName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              검사 항목
            </span>
            <select
              name="code"
              defaultValue={codeFilter ?? ""}
              style={inputStyle}
            >
              <option value="">전체</option>
              {codes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              결과
            </span>
            <select
              name="status"
              defaultValue={statusFilter}
              style={inputStyle}
            >
              <option value="all">전체</option>
              <option value="pass">일치</option>
              <option value="fail">불일치</option>
            </select>
          </label>

          <button
            type="submit"
            style={{
              padding: "11px 22px",
              background: "#2563eb",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            조회
          </button>
        </form>
      </section>

      <section
        style={{
          marginTop: 24,
          padding: 24,
          background: "#1e293b",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 20 }}>
          정합성 점검 요약
        </h2>

        <p style={{ marginTop: 8, color: "#94a3b8" }}>
          기준월 {ym} · 기관계정 {accountId} ·
          회계 보고 기준일 {report.reportDate ?? "없음"}
        </p>

        <div
          style={{
            display: "flex",
            gap: 40,
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <div>
            <p style={{ color: "#94a3b8" }}>전체 검사</p>
            <strong style={{ fontSize: 28 }}>{report.total}건</strong>
          </div>
          <div>
            <p style={{ color: "#94a3b8" }}>일치</p>
            <strong style={{ fontSize: 28, color: "#4ade80" }}>
              {report.passed}건
            </strong>
          </div>
          <div>
            <p style={{ color: "#94a3b8" }}>불일치</p>
            <strong style={{ fontSize: 28, color: "#f87171" }}>
              {report.failed}건
            </strong>
          </div>
        </div>

        <p style={{ marginTop: 16, color: "#94a3b8", fontSize: 13 }}>
          학생 검사는 학생별, 기관계정 검사는 출처별로 집계합니다.
          기관계정 검사는 기준월과 별도로 최신 회계 보고 기준일을 사용합니다.
        </p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, marginBottom: 14 }}>
          CHK-01~08 항목별 현황
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(215px, 1fr))",
            gap: 12,
          }}
        >
          {summary.map((item) => (
            <Link
              key={item.code}
              href={`/checks?ym=${ym}&accountId=${accountId}&code=${item.code}`}
              style={{
                background: "#1e293b",
                padding: 18,
                borderRadius: 10,
                border: "1px solid #475569",
              }}
            >
              <strong style={{ color: "#93c5fd" }}>
                {item.code}
              </strong>
              <p style={{ marginTop: 6 }}>
                {CHECK_NAMES[item.code]}
              </p>
              <p style={{ marginTop: 12, fontSize: 14 }}>
                전체 {item.total}건 ·{" "}
                <span
                  style={{
                    color:
                      item.failed > 0 ? "#f87171" : "#4ade80",
                  }}
                >
                  불일치 {item.failed}건
                </span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>
          검사 상세 결과 ({rows.length}건)
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              minWidth: 950,
            }}
          >
            <thead>
              <tr style={{ background: "#1e293b" }}>
                {[
                  "검사",
                  "검사명",
                  "구분",
                  "대상",
                  "결과",
                  "차이 및 메시지",
                  "상세",
                ].map((heading) => (
                  <th key={heading} style={cellStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.code}-${row.target}-${index}`}>
                  <td style={cellStyle}>{row.code}</td>
                  <td style={cellStyle}>
                    {CHECK_NAMES[row.code]}
                  </td>
                  <td style={cellStyle}>{row.category}</td>
                  <td style={cellStyle}>
                    <strong>{row.targetName}</strong>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>
                      {row.target}
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <strong
                      style={{
                        color: row.result.ok
                          ? "#4ade80"
                          : "#f87171",
                      }}
                    >
                      {row.result.ok ? "일치" : "불일치"}
                    </strong>
                  </td>
                  <td style={cellStyle}>
                    {row.result.note && (
                      <p style={{ marginBottom: 8, color: "#facc15" }}>
                        {row.result.note}
                      </p>
                    )}

                    {row.result.diffs.map((diff, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "4px 0",
                          fontSize: 13,
                        }}
                      >
                        <strong>{diff.field}</strong>
                        <div style={{ color: "#94a3b8" }}>
                          본 시스템: {displayValue(diff.ours)}
                        </div>
                        <div style={{ color: "#f87171" }}>
                          원천/기대값: {displayValue(diff.source)}
                        </div>
                      </div>
                    ))}

                    {!row.result.note &&
                      row.result.diffs.length === 0 &&
                      "-"}
                  </td>
                  <td style={cellStyle}>
                    <Link
                      href={row.detailUrl}
                      style={{
                        color: "#93c5fd",
                        textDecoration: "underline",
                        whiteSpace: "nowrap",
                      }}
                    >
                      상세 보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <p
              style={{
                textAlign: "center",
                padding: 24,
                color: "#94a3b8",
              }}
            >
              조건에 해당하는 검사 결과가 없습니다.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
