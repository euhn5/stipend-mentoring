
import Link from "next/link";

import { getRoster } from "@/queries/roster";
import {
  FUND_CODES,
  getPayments,
} from "@/queries/payments";
import { getAccountSummary } from "@/queries/ledger";

type DashboardTab = "roster" | "payments" | "accounts";

type Props = {
  searchParams: Promise<{
    tab?: string;
    ym?: string;
  }>;
};

const money = (value: number) =>
  value.toLocaleString("ko-KR") + "원";

const cardStyle = {
  padding: 24,
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
};

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #334155",
};

function Metric({
  label,
  value,
  color = "#f8fafc",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        {label}
      </p>
      <strong
        style={{
          display: "block",
          marginTop: 8,
          fontSize: 26,
          color,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function CheckSummary({
  items,
}: {
  items: { code: string; failed: number; total: number }[];
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      {items.map((item) => (
        <div
          key={item.code}
          style={{
            padding: 16,
            border: "1px solid #475569",
            borderRadius: 8,
            minWidth: 160,
          }}
        >
          <strong>{item.code}</strong>
          <p style={{ marginTop: 8 }}>
            전체 {item.total}건
          </p>
          <p
            style={{
              marginTop: 4,
              color:
                item.failed > 0 ? "#f87171" : "#4ade80",
            }}
          >
            불일치 {item.failed}건
          </p>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const tab: DashboardTab =
    params.tab === "payments"
      ? "payments"
      : params.tab === "accounts"
        ? "accounts"
        : "roster";

  const ym = /^\d{4}-(0[1-9]|1[0-2])$/.test(
    params.ym ?? ""
  )
    ? params.ym!
    : "2026-03";

  // 선택한 탭에 필요한 데이터만 조회
  const roster =
    tab === "roster" ? await getRoster({ ym }) : [];

  const payments =
    tab === "payments"
      ? await getPayments({ ym })
      : [];

  const accounts =
    tab === "accounts"
      ? await Promise.all([
          getAccountSummary("A01"),
          getAccountSummary("A02"),
        ])
      : [];

  const overallO = roster.filter(
    (row) => row.overall === "O"
  ).length;

  const overallX = roster.filter(
    (row) => row.overall === "X"
  ).length;

  const degrees = new Map<string, number>();

  for (const row of roster) {
    degrees.set(
      row.degree,
      (degrees.get(row.degree) ?? 0) + 1
    );
  }

  const rosterChecks = [
    {
      code: "CHK-01",
      total: roster.length,
      failed: roster.filter((row) => !row.chk01.ok).length,
    },
    {
      code: "CHK-02",
      total: roster.length,
      failed: roster.filter((row) => !row.chk02.ok).length,
    },
    {
      code: "CHK-03",
      total: roster.length,
      failed: roster.filter((row) => !row.chk03.ok).length,
    },
  ];

  const totalPaid = payments.reduce(
    (sum, row) => sum + row.totalPaid,
    0
  );

  const totalShortage = payments.reduce(
    (sum, row) => sum + (row.shortageAmount ?? 0),
    0
  );

  const shortageStudents = payments.filter(
    (row) =>
      row.shortageAmount !== null &&
      row.shortageAmount > 0
  ).length;

  const fundTotals = FUND_CODES.map((code) => ({
    code,
    amount: payments.reduce(
      (sum, row) => sum + row.fundAmounts[code],
      0
    ),
  }));

  const paymentChecks = [
    {
      code: "CHK-04",
      total: payments.length,
      failed: payments.filter((row) => !row.chk04.ok).length,
    },
    {
      code: "CHK-05",
      total: payments.length,
      failed: payments.filter((row) => !row.chk05.ok).length,
    },
  ];

  const accountIncome = accounts.reduce(
    (sum, row) => sum + row.totalIncome,
    0
  );

  const accountExpense = accounts.reduce(
    (sum, row) => sum + row.totalExpense,
    0
  );

  const accountBalance = accounts.reduce(
    (sum, row) => sum + row.totalBalance,
    0
  );

  return (
    <main
      style={{
        maxWidth: 1350,
        margin: "0 auto",
        padding: 32,
      }}
    >
      <h1 style={{ fontSize: 30, fontWeight: 700 }}>
        연구생활장려금 관리 대시보드
      </h1>

      <p
        style={{
          marginTop: 10,
          color: "#94a3b8",
        }}
      >
        학생연구자 지원자격, 연구지원금 지급 및 기관계정
        현황을 확인합니다.
      </p>

      <nav
        style={{
          display: "flex",
          gap: 24,
          marginTop: 30,
          borderBottom: "1px solid #475569",
        }}
      >
        {[
          { id: "roster", name: "명부" },
          { id: "payments", name: "지급" },
          { id: "accounts", name: "기관계정" },
        ].map((item) => (
          <Link
            key={item.id}
            href={`/?tab=${item.id}&ym=${ym}`}
            style={{
              padding: "12px 16px",
              fontWeight: tab === item.id ? 700 : 400,
              color:
                tab === item.id
                  ? "#93c5fd"
                  : "#94a3b8",
              borderBottom:
                tab === item.id
                  ? "3px solid #60a5fa"
                  : "3px solid transparent",
            }}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      {tab !== "accounts" && (
        <section style={{ marginTop: 24 }}>
          <form
            method="get"
            action="/"
            style={{
              display: "flex",
              alignItems: "end",
              gap: 12,
            }}
          >
            <input type="hidden" name="tab" value={tab} />

            <label>
              <span
                style={{
                  display: "block",
                  marginBottom: 8,
                }}
              >
                기준월
              </span>

              <input
                name="ym"
                type="month"
                defaultValue={ym}
                required
                style={{
                  padding: 12,
                  background: "#0f172a",
                  color: "#f8fafc",
                  border: "1px solid #475569",
                  borderRadius: 8,
                }}
              />
            </label>

            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "#fff",
                padding: "12px 22px",
                border: 0,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              조회
            </button>
          </form>
        </section>
      )}

      {/* 명부 탭 */}
      {tab === "roster" && (
        <>
          <section
            style={{
              ...cardStyle,
              marginTop: 26,
            }}
          >
            <h2 style={{ fontSize: 20 }}>
              {ym} 명부 요약
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 48,
                marginTop: 20,
              }}
            >
              <Metric
                label="참여학생"
                value={`${roster.length}명`}
              />
              <Metric
                label="지원자격 O"
                value={`${overallO}명`}
                color="#4ade80"
              />
              <Metric
                label="지원자격 X"
                value={`${overallX}명`}
                color="#f87171"
              />
            </div>
          </section>

          <section style={{ marginTop: 30 }}>
            <h2 style={{ fontSize: 20 }}>
              학위과정별 학생 분포
            </h2>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 14,
                marginTop: 16,
              }}
            >
              {[...degrees.entries()].map(
                ([degree, count]) => (
                  <div key={degree} style={cardStyle}>
                    <Metric
                      label={degree}
                      value={`${count}명`}
                    />
                  </div>
                )
              )}
            </div>
          </section>

          <section style={{ marginTop: 30 }}>
            <h2
              style={{
                fontSize: 20,
                marginBottom: 16,
              }}
            >
              학적·지원요건 정합성
            </h2>

            <CheckSummary items={rosterChecks} />
          </section>

          <Link
            href={`/roster?ym=${ym}`}
            style={{
              display: "inline-block",
              marginTop: 24,
              color: "#93c5fd",
              textDecoration: "underline",
            }}
          >
            학생연구자 명부 상세 보기
          </Link>
        </>
      )}

      {/* 지급 탭 */}
      {tab === "payments" && (
        <>
          <section
            style={{
              ...cardStyle,
              marginTop: 26,
            }}
          >
            <h2 style={{ fontSize: 20 }}>
              {ym} 지급 요약
            </h2>

            <div
              style={{
                display: "flex",
                gap: 40,
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
              <Metric
                label="총지급액"
                value={money(totalPaid)}
              />
              <Metric
                label="부족 학생"
                value={`${shortageStudents}명`}
                color="#f87171"
              />
              <Metric
                label="부족금액 합계"
                value={money(totalShortage)}
                color="#f87171"
              />
            </div>
          </section>

          <section style={{ marginTop: 30 }}>
            <h2
              style={{
                fontSize: 20,
                marginBottom: 16,
              }}
            >
              재원별 지급액 및 비중
            </h2>

            <div style={{ ...cardStyle, overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={cellStyle}>재원</th>
                    <th style={cellStyle}>지급액</th>
                    <th style={cellStyle}>비중</th>
                  </tr>
                </thead>

                <tbody>
                  {fundTotals.map((row) => (
                    <tr key={row.code}>
                      <td style={cellStyle}>{row.code}</td>

                      <td style={cellStyle}>
                        {money(row.amount)}
                      </td>

                      <td style={cellStyle}>
                        {totalPaid > 0
                          ? `${(
                              (row.amount / totalPaid) *
                              100
                            ).toFixed(1)}%`
                          : "0.0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={{ marginTop: 30 }}>
            <h2
              style={{
                fontSize: 20,
                marginBottom: 16,
              }}
            >
              지급 정합성
            </h2>

            <CheckSummary items={paymentChecks} />
          </section>

          <Link
            href={`/payments?ym=${ym}`}
            style={{
              display: "inline-block",
              marginTop: 24,
              color: "#93c5fd",
              textDecoration: "underline",
            }}
          >
            지급내역 상세 보기
          </Link>
        </>
      )}

      {/* 기관계정 탭 */}
      {tab === "accounts" && (
        <>
          <section
            style={{
              ...cardStyle,
              marginTop: 26,
            }}
          >
            <h2 style={{ fontSize: 20 }}>
              기관계정 전체 요약
            </h2>

            <div
              style={{
                display: "flex",
                gap: 40,
                flexWrap: "wrap",
                marginTop: 20,
              }}
            >
              <Metric
                label="수입총액"
                value={money(accountIncome)}
              />
              <Metric
                label="지급총액"
                value={money(accountExpense)}
              />
              <Metric
                label="잔액총액"
                value={money(accountBalance)}
              />
            </div>
          </section>

          {accounts.map((item) => {
            const checks = [
              {
                code: "CHK-06",
                total: 1,
                failed: item.chk06.ok ? 0 : 1,
              },
              {
                code: "CHK-07",
                total: 1,
                failed: item.chk07.ok ? 0 : 1,
              },
              {
                code: "CHK-08",
                total: 1,
                failed: item.chk08.ok ? 0 : 1,
              },
            ];

            return (
              <section
                key={item.accountId}
                style={{
                  ...cardStyle,
                  marginTop: 24,
                }}
              >
                <h2 style={{ fontSize: 21 }}>
                  {item.accountId} 기관계정
                </h2>

                <p
                  style={{
                    marginTop: 8,
                    color: "#94a3b8",
                  }}
                >
                  회계 보고 기준일:{" "}
                  {item.reportDate ?? "없음"}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 35,
                    flexWrap: "wrap",
                    marginTop: 22,
                  }}
                >
                  <Metric
                    label="수입"
                    value={money(item.totalIncome)}
                  />
                  <Metric
                    label="지급"
                    value={money(item.totalExpense)}
                  />
                  <Metric
                    label="잔액"
                    value={money(item.totalBalance)}
                  />
                </div>

                <div style={{ marginTop: 24 }}>
                  <CheckSummary items={checks} />
                </div>

                <Link
                  href={`/accounts/${item.accountId}?from=2026-01-01&to=2026-06-30`}
                  style={{
                    display: "inline-block",
                    marginTop: 22,
                    color: "#93c5fd",
                    textDecoration: "underline",
                  }}
                >
                  {item.accountId} 거래 원장 상세 보기
                </Link>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}

