
import Link from "next/link";

import { getSemester } from "@/queries/semester";

type Props = {
  searchParams: Promise<{
    term?: string;
    view?: string;
  }>;
};

const money = (value: number) =>
  value.toLocaleString("ko-KR");

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #334155",
  whiteSpace: "nowrap" as const,
};

export default async function SemesterPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const term = params.term ?? "2026-1";

  const view =
    params.view === "payments" ? "payments" : "roster";

  const semester = await getSemester(term);

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        학기별 현황
      </h1>

      <p
        style={{
          marginTop: 8,
          color: "#94a3b8",
        }}
      >
        학생별 6개월 지원자격, 지급액과 부족금액을
        조회합니다.
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
          action="/semester"
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
            alignItems: "end",
            flexWrap: "wrap",
          }}
        >
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              학기
            </span>

            <select
              name="term"
              defaultValue={term}
              style={{
                padding: 12,
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #475569",
                borderRadius: 8,
              }}
            >
              <option value="2026-1">2026년 1학기</option>
              <option value="2026-2">2026년 2학기</option>
            </select>
          </label>

          <input
            type="hidden"
            name="view"
            value={view}
          />

          <button
            type="submit"
            style={{
              padding: "12px 20px",
              background: "#2563eb",
              color: "white",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            조회
          </button>
        </form>
      </section>

      {/* 학기 전체 요약 */}
      <section
        style={{
          marginTop: 24,
          background: "#1e293b",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 20 }}>
          {term} 학기 요약
        </h2>

        <div
          style={{
            display: "flex",
            gap: 40,
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <div>
            <p style={{ color: "#94a3b8" }}>
              참여 학생
            </p>
            <strong style={{ fontSize: 26 }}>
              {semester.students.length}명
            </strong>
          </div>

          <div>
            <p style={{ color: "#94a3b8" }}>
              학기 총지급액
            </p>
            <strong style={{ fontSize: 26 }}>
              {money(semester.totalPaid)}원
            </strong>
          </div>

          <div>
            <p style={{ color: "#94a3b8" }}>
              학기 부족금액 합계
            </p>
            <strong
              style={{
                fontSize: 26,
                color: "#f87171",
              }}
            >
              {money(semester.totalShortage)}원
            </strong>
          </div>
        </div>
      </section>

      {/* 화면 전환 */}
      <nav
        style={{
          display: "flex",
          gap: 24,
          borderBottom: "1px solid #475569",
          marginTop: 32,
        }}
      >
        <Link
          href={`/semester?term=${term}&view=roster`}
          style={{
            padding: 12,
            color:
              view === "roster"
                ? "#93c5fd"
                : "#94a3b8",
            borderBottom:
              view === "roster"
                ? "3px solid #60a5fa"
                : "3px solid transparent",
          }}
        >
          지원자격 현황
        </Link>

        <Link
          href={`/semester?term=${term}&view=payments`}
          style={{
            padding: 12,
            color:
              view === "payments"
                ? "#93c5fd"
                : "#94a3b8",
            borderBottom:
              view === "payments"
                ? "3px solid #60a5fa"
                : "3px solid transparent",
          }}
        >
          지급·부족금액 현황
        </Link>
      </nav>

      <section style={{ marginTop: 24 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          학생별 월간 현황
        </h2>

        <p
          style={{
            fontSize: 13,
            color: "#94a3b8",
            marginBottom: 16,
          }}
        >
          금액 단위: 원 · 학적 미연동 월은 "-"로
          표시합니다. 지원자격이 없는 달의 부족금액은
          계산에서 제외합니다.
        </p>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #475569",
            borderRadius: 8,
          }}
        >
          <table
            style={{
              width: "100%",
              minWidth: 1250,
              borderCollapse: "collapse",
              textAlign: "right",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#1e293b",
                }}
              >
                <th style={cellStyle}>학번</th>
                <th style={cellStyle}>이름</th>

                {semester.months.map((ym) => (
                  <th key={ym} style={cellStyle}>
                    {ym}
                  </th>
                ))}

                <th style={cellStyle}>
                  {view === "payments"
                    ? "학기 총지급액"
                    : "부족 발생 월"}
                </th>

                <th style={cellStyle}>
                  학기 부족금액
                </th>
              </tr>
            </thead>

            <tbody>
              {semester.students.map((student) => (
                <tr key={student.studentNo}>
                  <td style={cellStyle}>
                    {student.studentNo}
                  </td>

                  <td style={cellStyle}>
                    <Link
                      href={`/students/${student.studentNo}?ym=${semester.months[0]}&tab=payments`}
                      style={{
                        color: "#93c5fd",
                        textDecoration: "underline",
                      }}
                    >
                      {student.name}
                    </Link>
                  </td>

                  {student.months.map((month) => {
                    const row = month.data;

                    if (!row) {
                      return (
                        <td
                          key={month.ym}
                          style={{
                            ...cellStyle,
                            color: "#94a3b8",
                          }}
                        >
                          -
                        </td>
                      );
                    }

                    if (view === "payments") {
                      return (
                        <td
                          key={month.ym}
                          style={cellStyle}
                        >
                          <div>
                            {money(row.totalPaid)}
                          </div>

                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 12,
                              color:
                                row.shortageAmount &&
                                row.shortageAmount > 0
                                  ? "#f87171"
                                  : "#94a3b8",
                            }}
                          >
                            부족:{" "}
                            {row.shortageAmount === null
                              ? "-"
                              : money(row.shortageAmount)}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={month.ym} style={cellStyle}>
                        <strong
                          style={{
                            color:
                              row.overall === "O"
                                ? "#4ade80"
                                : "#f87171",
                          }}
                        >
                          {row.overall}
                        </strong>

                        <div
                          style={{
                            color:
                              row.shortageAmount &&
                              row.shortageAmount > 0
                                ? "#f87171"
                                : "#94a3b8",
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          부족:{" "}
                          {row.shortageAmount === null
                            ? "-"
                            : money(row.shortageAmount)}
                        </div>
                      </td>
                    );
                  })}

                  <td style={cellStyle}>
                    {view === "payments"
                      ? money(student.totalPaid)
                      : `${student.shortageMonths}개월`}
                  </td>

                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: 700,
                      color:
                        student.totalShortage > 0
                          ? "#f87171"
                          : "#4ade80",
                    }}
                  >
                    {money(student.totalShortage)}
                  </td>
                </tr>
              ))}

              {semester.students.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    해당 학기의 연동 데이터가 없습니다.
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
