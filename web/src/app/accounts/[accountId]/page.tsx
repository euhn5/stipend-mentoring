
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { account } from "@/db/schema";
import {
  getLedgerRows,
  getOpeningBalances,
  getAccountSummary,
} from "@/queries/ledger";
import type { CheckResult } from "@/domain/checks";

type Props = {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    source?: string;
    sort?: string;
  }>;
};

const money = (n: number) =>
  n.toLocaleString("ko-KR") + "원";

const thStyle = {
  padding: 12,
  whiteSpace: "nowrap" as const,
  borderBottom: "1px solid #475569",
};

const tdStyle = {
  padding: 12,
  whiteSpace: "nowrap" as const,
  borderBottom: "1px solid #334155",
};

const inputStyle = {
  padding: 10,
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #475569",
  borderRadius: 6,
};

function CheckStatus({
  label,
  result,
}: {
  label: string;
  result: CheckResult;
}) {
  return (
    <details style={{ display: "inline-block" }}>
      <summary
        style={{
          color: result.ok ? "#4ade80" : "#f87171",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        {label}: {result.ok ? "일치" : "불일치"}
      </summary>

      {!result.ok && (
        <div
          style={{
            padding: 12,
            marginTop: 8,
            background: "#0f172a",
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {result.note && <p>{result.note}</p>}

          {result.diffs.map((diff) => (
            <p key={diff.field}>
              {diff.field}: 본 시스템{" "}
              {String(diff.ours ?? "-")} /
              보고값 {String(diff.source ?? "-")}
            </p>
          ))}
        </div>
      )}
    </details>
  );
}

export default async function AccountPage({
  params,
  searchParams,
}: Props) {
  const { accountId } = await params;
  const query = await searchParams;

  const from = query.from || "2026-01-01";
  const to = query.to || "2026-06-30";
  const descending = query.sort === "desc";

  const accounts = await db
    .select()
    .from(account)
    .orderBy(asc(account.accountId));

  const currentAccount = accounts.find(
    (item) => item.accountId === accountId
  );

  if (!currentAccount) notFound();

  const filter = { accountId, from, to };

  const [ledger, opening, summary] =
    await Promise.all([
      getLedgerRows(filter),
      getOpeningBalances(filter),
      getAccountSummary(accountId),
    ]);

  const sources = [
    ...new Set([
      ...summary.sources.map((r) => r.sourceItem),
      ...opening.map((r) => r.sourceItem),
      ...ledger.map((r) => r.sourceItem),
    ]),
  ].sort();

  const selectedSource = sources.includes(query.source || "")
    ? query.source || ""
    : "";

  const visibleLedger = ledger
    .filter(
      (r) =>
        !selectedSource ||
        r.sourceItem === selectedSource
    )
    .sort((a, b) => {
      const cmp =
        a.txnDate.localeCompare(b.txnDate) ||
        a.txnId - b.txnId;

      return descending ? -cmp : cmp;
    });

  const visibleOpening = opening.filter(
    (r) =>
      !selectedSource ||
      r.sourceItem === selectedSource
  );

  const sectionStyle = {
    marginTop: 24,
    padding: 24,
    background: "#1e293b",
    borderRadius: 10,
  };

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        기관계정 원장
      </h1>

      <p style={{ marginTop: 8, color: "#94a3b8" }}>
        {currentAccount.accountName} ({accountId}) ·
        수입, 지급, 출처별 누적잔액 및 회계 정합성
      </p>

      {/* 조회 조건 */}
      <section
        style={{
          marginTop: 28,
          padding: 24,
          border: "1px solid #475569",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 20 }}>
          조회 조건
        </h2>

        <form
          action={`/accounts/${encodeURIComponent(accountId)}`}
          method="get"
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "end",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              시작일
            </span>
            <input
              type="date"
              name="from"
              defaultValue={from}
              required
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              종료일
            </span>
            <input
              type="date"
              name="to"
              defaultValue={to}
              required
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              출처
            </span>
            <select
              name="source"
              defaultValue={selectedSource}
              style={inputStyle}
            >
              <option value="">전체</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              일자 정렬
            </span>
            <select
              name="sort"
              defaultValue={descending ? "desc" : "asc"}
              style={inputStyle}
            >
              <option value="asc">오름차순</option>
              <option value="desc">내림차순</option>
            </select>
          </label>

          <button
            type="submit"
            style={{
              padding: "11px 20px",
              background: "#2563eb",
              color: "white",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            조회
          </button>

          <Link
            href={`/accounts/${encodeURIComponent(accountId)}`}
            style={{
              padding: "11px 16px",
              border: "1px solid #64748b",
              borderRadius: 8,
              color: "#f8fafc",
            }}
          >
            초기화
          </Link>
        </form>

        <div style={{ marginTop: 16 }}>
          계정 변경:{" "}
          {accounts.map((item) => (
            <Link
              key={item.accountId}
              href={`/accounts/${encodeURIComponent(item.accountId)}`}
              style={{
                display: "inline-block",
                marginRight: 16,
                color:
                  item.accountId === accountId
                    ? "#ffffff"
                    : "#93c5fd",
                fontWeight:
                  item.accountId === accountId ? 700 : 400,
              }}
            >
              {item.accountId} · {item.accountName}
            </Link>
          ))}
        </div>
      </section>

      {/* 전체 요약 */}
      <section style={sectionStyle}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>
          기관계정 요약
        </h2>

        <p style={{ color: "#94a3b8", marginBottom: 16 }}>
          회계 보고 기준일: {summary.reportDate ?? "없음"}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
          }}
        >
          {[
            ["전년도 잔액", summary.carryAmount],
            ["대상연도 수입", summary.currentYearIncome],
            ["이자 수입", summary.interestIncome],
            ["수입총액", summary.totalIncome],
            ["지급총액", summary.totalExpense],
            ["잔액총액", summary.totalBalance],
          ].map(([label, amount]) => (
            <div key={String(label)}>
              <div style={{ color: "#94a3b8" }}>
                {label}
              </div>
              <strong style={{ fontSize: 22 }}>
                {money(Number(amount))}
              </strong>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            marginTop: 24,
          }}
        >
          <CheckStatus label="CHK-06" result={summary.chk06} />
          <CheckStatus label="CHK-07" result={summary.chk07} />
          <CheckStatus label="CHK-08" result={summary.chk08} />
        </div>
      </section>

      {/* 출처별 소계 */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 16 }}>
          출처별 수입·지급·잔액
        </h2>
        <p style={{ color: "#94a3b8", marginBottom: 12 }}>
          회계 보고 기준일까지의 누적 금액입니다.
          조회 날짜를 바꿔도 정합성 검사 기준은 유지됩니다.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "right",
            }}
          >
            <thead>
              <tr style={{ background: "#1e293b" }}>
                {[
                  "출처",
                  "수입",
                  "지급",
                  "잔액",
                  "CHK-06",
                  "CHK-07",
                ].map((heading) => (
                  <th key={heading} style={thStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.sources.map((row) => (
                <tr key={row.sourceItem}>
                  <td style={tdStyle}>{row.sourceItem}</td>
                  <td style={tdStyle}>{money(row.inTotal)}</td>
                  <td style={tdStyle}>{money(row.outTotal)}</td>
                  <td style={tdStyle}>{money(row.balance)}</td>
                  <td style={tdStyle}>
                    <CheckStatus
                      label="CHK-06"
                      result={row.chk06}
                    />
                  </td>
                  <td style={tdStyle}>
                    <CheckStatus
                      label="CHK-07"
                      result={row.chk07}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 원장 */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>
          거래 원장
        </h2>
        <p style={{ color: "#94a3b8", marginBottom: 16 }}>
          {from} ~ {to} · 거래 {visibleLedger.length}건
          · 누적잔액은 출처별로 계산됩니다.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "right",
              minWidth: 1100,
            }}
          >
            <thead>
              <tr style={{ background: "#1e293b" }}>
                {[
                  "일자",
                  "구분",
                  "항목",
                  "출처",
                  "수입액",
                  "지급액",
                  "출처별 누적잔액",
                  "적요",
                ].map((heading) => (
                  <th key={heading} style={thStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* 조회 시작일 이전의 출처별 기초잔액 */}
              {visibleOpening.map((row) => (
                <tr
                  key={`opening-${row.sourceItem}`}
                  style={{ background: "#172033" }}
                >
                  <td style={tdStyle}>{from} 이전</td>
                  <td style={tdStyle}>기초잔액</td>
                  <td style={tdStyle}>-</td>
                  <td style={tdStyle}>{row.sourceItem}</td>
                  <td style={tdStyle}>-</td>
                  <td style={tdStyle}>-</td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    {money(row.balance)}
                  </td>
                  <td style={tdStyle}>조회 시작일 전 누적</td>
                </tr>
              ))}

              {visibleLedger.map((row) => (
                <tr key={row.txnId}>
                  <td style={tdStyle}>{row.txnDate}</td>
                  <td
                    style={{
                      ...tdStyle,
                      color:
                        row.direction === "IN"
                          ? "#4ade80"
                          : "#f87171",
                    }}
                  >
                    {row.direction === "IN" ? "수입" : "지급"}
                  </td>
                  <td style={tdStyle}>{row.itemCode}</td>
                  <td style={tdStyle}>{row.sourceItem}</td>
                  <td style={tdStyle}>
                    {row.direction === "IN"
                      ? money(row.amount)
                      : "-"}
                  </td>
                  <td style={tdStyle}>
                    {row.direction === "OUT"
                      ? money(row.amount)
                      : "-"}
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>
                    {money(row.balance)}
                  </td>
                  <td style={tdStyle}>{row.memo ?? "-"}</td>
                </tr>
              ))}

              {visibleOpening.length === 0 &&
                visibleLedger.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: 24,
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      조회된 거래가 없습니다.
                      기관계정 연동 여부를 확인해 주세요.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
