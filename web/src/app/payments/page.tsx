import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";

import {
  FUND_CODES,
  getPayments,
} from "@/queries/payments";

import type {
  PaymentRow,
} from "@/queries/payments";

import type {
  CheckResult,
} from "@/domain/checks";

type SearchParams = {
  ym?: string;
  advisor?: string;
  meets?: string;
  q?: string;
};

const money = (value: number) =>
  value.toLocaleString("ko-KR");

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #334155",
  whiteSpace: "nowrap" as const,
  textAlign: "right" as const,
};

const textCellStyle = {
  ...cellStyle,
  textAlign: "left" as const,
};

const inputStyle = {
  padding: 10,
  border: "1px solid #475569",
  borderRadius: 6,
  background: "#0f172a",
  color: "#f8fafc",
};

function CheckCell({
  label,
  result,
}: {
  label: string;
  result: CheckResult;
}) {
  if (result.ok) {
    return (
      <span style={{ color: "#4ade80" }}>
        {label}: 일치
      </span>
    );
  }

  return (
    <details>
      <summary
        style={{
          color: "#f87171",
          cursor: "pointer",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {label}: 불일치
      </summary>

      <div
        style={{
          marginTop: 8,
          padding: 12,
          background: "#1e293b",
          borderRadius: 8,
          minWidth: 240,
          fontSize: 12,
          textAlign: "left",
        }}
      >
        {result.note && (
          <p style={{ marginBottom: 8 }}>
            {result.note}
          </p>
        )}

        {result.diffs.map((diff) => (
          <div
            key={diff.field}
            style={{ marginBottom: 10 }}
          >
            <strong>재원/항목: {diff.field}</strong>
            <div>
              본 시스템: {String(diff.ours ?? "-")}
            </div>
            <div>
              원천/기대값: {String(diff.source ?? "-")}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

function Status({ value }: { value: string }) {
  return (
    <strong
      style={{
        color:
          value === "O" ? "#4ade80" : "#f87171",
      }}
    >
      {value}
    </strong>
  );
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const ym = params.ym || "2026-03";

  const meets =
    params.meets === "O" || params.meets === "X"
      ? params.meets
      : undefined;

  
  // 로그인 사용자 확인
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // 지도교수는 자신의 교수 ID만 적용
  const effectiveAdvisor =
    session.role === "PROF"
      ? session.profId!
      : params.advisor || undefined;

  // 필터 목록 생성용 데이터도 담당 학생으로 제한
  const allRows = await getPayments({
    ym,
    advisor:
      session.role === "PROF"
        ? session.profId!
        : undefined,
  });

  // 실제 지급내역 조회
  const rows = await getPayments({
    ym,
    advisor: effectiveAdvisor,
    meets,
    q: params.q || undefined,
  });


  const advisors = [
    ...new Map(
      allRows.map((row) => [
        row.advisorId,
        {
          id: row.advisorId,
          name:
            row.professorName || row.advisorId,
        },
      ])
    ).values(),
  ];

  // 표시 중인 학생들의 총합
  const totalPaid = rows.reduce(
    (sum, row) => sum + row.totalPaid,
    0
  );

  const totalShortage = rows.reduce(
    (sum, row) =>
      sum + (row.shortageAmount ?? 0),
    0
  );

  const shortageCount = rows.filter(
    (row) =>
      row.shortageAmount !== null &&
      row.shortageAmount > 0
  ).length;

  const fundTotals = Object.fromEntries(
    FUND_CODES.map((code) => [
      code,
      rows.reduce(
        (sum, row) =>
          sum + row.fundAmounts[code],
        0
      ),
    ])
  ) as Record<
    (typeof FUND_CODES)[number],
    number
  >;

  const integratedTotal =
    fundTotals.F11 +
    fundTotals.F12 +
    fundTotals.F13;

  const standardTotal = rows.reduce(
    (sum, row) =>
      sum + (row.standardAmount ?? 0),
    0
  );

  const mismatch04 = rows.filter(
    (row) => !row.chk04.ok
  ).length;

  const mismatch05 = rows.filter(
    (row) => !row.chk05.ok
  ).length;

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1800,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        학생지원금 지급내역
      </h1>

      <p
        style={{
          marginTop: 8,
          color: "#94a3b8",
        }}
      >
        월별 재원별 지급액, 기준금액 충족 여부,
        부족금액과 원천 데이터 정합성을 확인합니다.
      </p>

      {/* 조회 조건 */}
      <section
        style={{
          marginTop: 28,
          border: "1px solid #475569",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          조회 조건
        </h2>

        <form
          method="get"
          action="/payments"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "end",
            gap: 12,
            marginTop: 20,
          }}
        >
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
              type="month"
              name="ym"
              defaultValue={ym}
              required
              style={inputStyle}
            />
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              지도교수
            </span>

            <select
              name="advisor"
              defaultValue={params.advisor || ""}
              style={inputStyle}
            >
              <option value="">전체</option>

              {advisors.map((advisor) => (
                <option
                  key={advisor.id}
                  value={advisor.id}
                >
                  {advisor.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              기준금액 충족
            </span>

            <select
              name="meets"
              defaultValue={meets || ""}
              style={inputStyle}
            >
              <option value="">전체</option>
              <option value="O">
                O (충족)
              </option>
              <option value="X">
                X (미충족)
              </option>
            </select>
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              이름 / 학번
            </span>

            <input
              type="text"
              name="q"
              defaultValue={params.q || ""}
              placeholder="이름 또는 학번"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            style={{
              padding: "11px 20px",
              border: 0,
              borderRadius: 8,
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            조회
          </button>

          <Link
            href={`/payments?ym=${encodeURIComponent(ym)}`}
            style={{
              padding: "11px 16px",
              border: "1px solid #64748b",
              borderRadius: 8,
              color: "#f8fafc",
            }}
          >
            필터 초기화
          </Link>
        </form>
      </section>

      {/* 지급 현황 요약 */}
      <section
        style={{
          marginTop: 24,
          padding: 24,
          background: "#1e293b",
          borderRadius: 10,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          {ym} 지급 현황
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 36,
            marginTop: 20,
          }}
        >
          <div>
            <div style={{ color: "#94a3b8" }}>
              조회 인원
            </div>
            <strong style={{ fontSize: 24 }}>
              {rows.length}명
            </strong>
          </div>

          <div>
            <div style={{ color: "#94a3b8" }}>
              총지급액
            </div>
            <strong style={{ fontSize: 24 }}>
              {money(totalPaid)}원
            </strong>
          </div>

          <div>
            <div style={{ color: "#94a3b8" }}>
              부족 학생
            </div>
            <strong
              style={{
                fontSize: 24,
                color: "#f87171",
              }}
            >
              {shortageCount}명
            </strong>
          </div>

          <div>
            <div style={{ color: "#94a3b8" }}>
              부족금액 합계
            </div>
            <strong
              style={{
                fontSize: 24,
                color: "#f87171",
              }}
            >
              {money(totalShortage)}원
            </strong>
          </div>

          <div>
            <div style={{ color: "#94a3b8" }}>
              CHK-04 불일치
            </div>
            <strong style={{ fontSize: 24 }}>
              {mismatch04}건
            </strong>
          </div>

          <div>
            <div style={{ color: "#94a3b8" }}>
              CHK-05 불일치
            </div>
            <strong
              style={{
                fontSize: 24,
                color:
                  mismatch05 > 0
                    ? "#f87171"
                    : "#4ade80",
              }}
            >
              {mismatch05}건
            </strong>
          </div>
        </div>
      </section>

      {/* 학생별 지급내역 */}
      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          학생별 지급내역
        </h2>

        <p
          style={{
            marginBottom: 12,
            color: "#94a3b8",
            fontSize: 13,
          }}
        >
          금액 단위: 원 · 가로 스크롤로
          전체 재원 및 검증 결과 확인
        </p>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #334155",
            borderRadius: 8,
          }}
        >
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: 1900,
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#1e293b",
                  color: "#f8fafc",
                }}
              >
                {[
                  "학번",
                  "이름",
                  "학위",
                  "지도교수",
                  "종합",
                  "F11",
                  "F12",
                  "F13",
                  "통합관리 소계",
                  "F20",
                  "F30",
                  "F40",
                  "F90",
                  "총지급액",
                  "기준금액",
                  "충족",
                  "부족금액",
                  "CHK-04",
                  "CHK-05",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      ...cellStyle,
                      textAlign: "right",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row: PaymentRow) => (
                <tr
                  key={`${row.baseYm}-${row.studentNo}`}
                >
                  <td style={textCellStyle}>
                    {row.studentNo}
                  </td>

                  <td style={textCellStyle}>
                    <Link
                      href={`/students/${encodeURIComponent(
                        row.studentNo
                      )}?ym=${encodeURIComponent(
                        ym
                      )}&tab=info`}
                      style={{
                        color: "#93c5fd",
                        textDecoration: "underline",
                      }}
                    >
                      {row.name}
                    </Link>
                  </td>

                  <td style={textCellStyle}>
                    {row.degree}
                  </td>

                  <td style={textCellStyle}>
                    {row.professorName || "-"}
                  </td>

                  <td style={cellStyle}>
                    <Status value={row.overall} />
                  </td>

                  {(
                    ["F11", "F12", "F13"] as const
                  ).map((code) => (
                    <td
                      key={code}
                      style={cellStyle}
                    >
                      {money(row.fundAmounts[code])}
                    </td>
                  ))}

                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: 700,
                    }}
                  >
                    {money(row.integratedSubtotal)}
                  </td>

                  {(
                    ["F20", "F30", "F40", "F90"] as const
                  ).map((code) => (
                    <td
                      key={code}
                      style={cellStyle}
                    >
                      {money(row.fundAmounts[code])}
                    </td>
                  ))}

                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: 700,
                    }}
                  >
                    {money(row.totalPaid)}
                  </td>

                  <td style={cellStyle}>
                    {row.standardAmount === null
                      ? "-"
                      : money(row.standardAmount)}
                  </td>

                  <td style={cellStyle}>
                    {row.meets === null ? (
                      "-"
                    ) : (
                      <Status value={row.meets} />
                    )}
                  </td>

                  <td style={cellStyle}>
                    {row.shortageAmount === null
                      ? "-"
                      : money(row.shortageAmount)}
                  </td>

                  <td style={cellStyle}>
                    <CheckCell
                      label="CHK-04"
                      result={row.chk04}
                    />
                  </td>

                  <td style={cellStyle}>
                    <CheckCell
                      label="CHK-05"
                      result={row.chk05}
                    />
                  </td>
                </tr>
              ))}

              {/* 합계 행 */}
              {rows.length > 0 && (
                <tr
                  style={{
                    background: "#1e293b",
                    fontWeight: 700,
                  }}
                >
                  <td
                    colSpan={5}
                    style={textCellStyle}
                  >
                    합계 ({rows.length}명)
                  </td>

                  <td style={cellStyle}>
                    {money(fundTotals.F11)}
                  </td>
                  <td style={cellStyle}>
                    {money(fundTotals.F12)}
                  </td>
                  <td style={cellStyle}>
                    {money(fundTotals.F13)}
                  </td>

                  <td style={cellStyle}>
                    {money(integratedTotal)}
                  </td>

                  <td style={cellStyle}>
                    {money(fundTotals.F20)}
                  </td>
                  <td style={cellStyle}>
                    {money(fundTotals.F30)}
                  </td>
                  <td style={cellStyle}>
                    {money(fundTotals.F40)}
                  </td>
                  <td style={cellStyle}>
                    {money(fundTotals.F90)}
                  </td>

                  <td style={cellStyle}>
                    {money(totalPaid)}
                  </td>

                  <td style={cellStyle}>
                    {money(standardTotal)}
                  </td>

                  <td style={cellStyle}>-</td>

                  <td style={cellStyle}>
                    {money(totalShortage)}
                  </td>

                  <td style={cellStyle}>-</td>
                  <td style={cellStyle}>-</td>
                </tr>
              )}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={19}
                    style={{
                      padding: 28,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    조회된 학생이 없습니다.
                    해당 기준월의 학적 및 지급 연동을
                    확인해 주세요.
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
