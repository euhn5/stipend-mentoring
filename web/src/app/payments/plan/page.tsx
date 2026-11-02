
import Link from "next/link";

import { getPaymentPlans } from "@/queries/plan";
import { savePaymentPlan } from "./actions";

type Props = {
  searchParams: Promise<{
    ym?: string;
    studentNo?: string;
  }>;
};

const formatMoney = (amount: number) =>
  amount.toLocaleString("ko-KR") + "원";

const inputStyle = {
  padding: "10px 12px",
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #475569",
  borderRadius: 8,
};

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #334155",
  whiteSpace: "nowrap" as const,
};

export default async function PaymentPlanPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const ym = /^\d{4}-(0[1-9]|1[0-2])$/.test(
    params.ym ?? ""
  )
    ? params.ym!
    : "2026-03";

  const allRows = await getPaymentPlans(ym);

  const students = [
    ...new Map(
      allRows.map((row) => [
        row.studentNo,
        {
          studentNo: row.studentNo,
          name: row.name,
        },
      ])
    ).values(),
  ].sort((a, b) =>
    a.studentNo.localeCompare(b.studentNo)
  );

  const selectedStudentNo =
    students.some(
      (student) =>
        student.studentNo === params.studentNo
    )
      ? params.studentNo!
      : students[0]?.studentNo ?? "";

  const rows = allRows.filter(
    (row) => row.studentNo === selectedStudentNo
  );

  const totalActual = rows.reduce(
    (sum, row) => sum + row.actualAmount,
    0
  );

  const totalPlanned = rows.reduce(
    (sum, row) => sum + (row.plannedAmount ?? 0),
    0
  );

  const plannedCount = rows.filter(
    (row) => row.plannedAmount !== null
  ).length;

  const allPlanned =
    rows.length > 0 && plannedCount === rows.length;

  const difference = totalActual - totalPlanned;

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1300,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        지급 계획 vs 실지급
      </h1>

      <p
        style={{
          marginTop: 8,
          color: "#94a3b8",
        }}
      >
        학생별·재원별 계획금액을 등록하고 실제 지급액과
        비교합니다. 계획 수정 이력은 감사로그에 기록됩니다.
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
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>
          조회 조건
        </h2>

        <form
          method="get"
          action="/payments/plan"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "end",
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
              style={inputStyle}
              required
            />
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              학생
            </span>

            <select
              name="studentNo"
              defaultValue={selectedStudentNo}
              style={{
                ...inputStyle,
                minWidth: 240,
              }}
            >
              {students.map((student) => (
                <option
                  key={student.studentNo}
                  value={student.studentNo}
                >
                  {student.name} ({student.studentNo})
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            style={{
              padding: "11px 22px",
              border: 0,
              borderRadius: 8,
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
            }}
          >
            조회
          </button>
        </form>
      </section>

      {/* 학생 요약 */}
      <section
        style={{
          marginTop: 24,
          padding: 24,
          background: "#1e293b",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 20 }}>
          {ym} 지급 계획 요약
        </h2>

        <p style={{ marginTop: 8, color: "#94a3b8" }}>
          선택 학생:{" "}
          {students.find(
            (student) =>
              student.studentNo === selectedStudentNo
          )?.name ?? "없음"}
          {" · "}
          계획 입력 {plannedCount}/{rows.length}개 재원
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 40,
            marginTop: 20,
          }}
        >
          <div>
            <p style={{ color: "#94a3b8" }}>
              입력된 계획금액 합계
            </p>
            <strong style={{ fontSize: 25 }}>
              {formatMoney(totalPlanned)}
            </strong>
          </div>

          <div>
            <p style={{ color: "#94a3b8" }}>
              실제 지급액
            </p>
            <strong style={{ fontSize: 25 }}>
              {formatMoney(totalActual)}
            </strong>
          </div>

          <div>
            <p style={{ color: "#94a3b8" }}>
              차이 (실지급 - 계획)
            </p>
            <strong
              style={{
                fontSize: 25,
                color: allPlanned
                  ? difference < 0
                    ? "#f87171"
                    : "#4ade80"
                  : "#94a3b8",
              }}
            >
              {allPlanned
                ? formatMoney(difference)
                : "계획 입력 미완료"}
            </strong>
          </div>
        </div>
      </section>

      {/* 계획 입력 및 비교 */}
      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          재원별 계획·실지급 비교
        </h2>

        <p
          style={{
            color: "#94a3b8",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          계획금액을 입력하고 각 행의 저장 버튼을 누르세요.
          계획이 없는 항목은 "-"로 표시하며, 0원 계획과
          구분합니다.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              minWidth: 850,
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ background: "#1e293b" }}>
                {[
                  "재원",
                  "계획금액",
                  "실지급액",
                  "차이",
                  "저장",
                ].map((title) => (
                  <th key={title} style={cellStyle}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const formId =
                  `plan-${row.studentNo}-${row.fundCode}`;

                return (
                  <tr key={row.fundCode}>
                    <td style={cellStyle}>
                      <strong>{row.fundCode}</strong>
                    </td>

                    <td style={cellStyle}>
                      <form
                        id={formId}
                        action={savePaymentPlan}
                      >
                        <input
                          type="hidden"
                          name="ym"
                          value={ym}
                        />

                        <input
                          type="hidden"
                          name="studentNo"
                          value={row.studentNo}
                        />

                        <input
                          type="hidden"
                          name="fundCode"
                          value={row.fundCode}
                        />

                        <input
                          type="number"
                          name="plannedAmount"
                          min="0"
                          step="1"
                          required
                          defaultValue={
                            row.plannedAmount ?? ""
                          }
                          placeholder="금액 입력"
                          style={{
                            ...inputStyle,
                            width: 180,
                          }}
                        />
                      </form>
                    </td>

                    <td style={cellStyle}>
                      {formatMoney(row.actualAmount)}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        color:
                          row.difference === null
                            ? "#94a3b8"
                            : row.difference < 0
                              ? "#f87171"
                              : row.difference > 0
                                ? "#4ade80"
                                : "#f8fafc",
                        fontWeight: 700,
                      }}
                    >
                      {row.difference === null
                        ? "-"
                        : formatMoney(row.difference)}
                    </td>

                    <td style={cellStyle}>
                      <button
                        type="submit"
                        form={formId}
                        style={{
                          padding: "10px 18px",
                          border: 0,
                          borderRadius: 8,
                          background: "#2563eb",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        저장
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    해당 기준월의 학생 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 24 }}>
          <Link
            href={`/payments?ym=${ym}`}
            style={{
              color: "#93c5fd",
              textDecoration: "underline",
            }}
          >
            전체 지급내역 보기
          </Link>

          <span style={{ margin: "0 12px" }}>·</span>

          <Link
            href="/audit?table=payment_plan&actor=admin"
            style={{
              color: "#93c5fd",
              textDecoration: "underline",
            }}
          >
            지급 계획 변경 감사로그
          </Link>
        </div>
      </section>
    </main>
  );
}
