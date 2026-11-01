
import Link from "next/link";

import { db } from "@/db/client";
import { professor } from "@/db/schema";
import { getRoster } from "@/queries/roster";

type SearchParams = {
  ym?: string;
};

export default async function ProfessorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const ym = params.ym || "2026-03";

  // 등록된 지도교수 조회
  const professors = await db.select().from(professor);

  // 선택한 기준월의 학생 명부
  const students = await getRoster({ ym });

  // 지도교수별 학생 수 및 지원자격 집계
  const rows = professors
    .map((prof) => {
      const myStudents = students.filter(
        (student) => student.advisorId === prof.profId
      );

      const eligibleCount = myStudents.filter(
        (student) => student.overall === "O"
      ).length;

      const ineligibleCount = myStudents.filter(
        (student) => student.overall === "X"
      ).length;

      return {
        ...prof,
        studentCount: myStudents.length,
        eligibleCount,
        ineligibleCount,
      };
    })
    .sort((a, b) => a.profId.localeCompare(b.profId));

  const totalStudents = rows.reduce(
    (sum, row) => sum + row.studentCount,
    0
  );

  const totalEligible = rows.reduce(
    (sum, row) => sum + row.eligibleCount,
    0
  );

  const totalIneligible = rows.reduce(
    (sum, row) => sum + row.ineligibleCount,
    0
  );

  const cellStyle = {
    padding: 14,
    borderBottom: "1px solid #334155",
    whiteSpace: "nowrap" as const,
  };

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        지도교수별 현황
      </h1>

      <p style={{ marginTop: 8, color: "#94a3b8" }}>
        기준월별 지도교수의 참여학생 수와 지원요건 판정
        현황을 확인합니다.
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
          action="/professors"
          style={{
            display: "flex",
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
              name="ym"
              type="month"
              defaultValue={ym}
              required
              style={{
                padding: 10,
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px solid #475569",
                borderRadius: 6,
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              padding: "11px 20px",
              background: "#2563eb",
              color: "#ffffff",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            조회
          </button>
        </form>
      </section>

      {/* 전체 요약 */}
      <section
        style={{
          marginTop: 24,
          padding: 24,
          background: "#1e293b",
          borderRadius: 10,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>
          {ym} 지도교수별 요약
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            marginTop: 20,
          }}
        >
          <div>
            <div style={{ color: "#94a3b8" }}>
              등록 지도교수
            </div>
            <strong style={{ fontSize: 24 }}>
              {rows.length}명
            </strong>
          </div>

          <div>
            <div style={{ color: "#94a3b8" }}>
              참여학생
            </div>
            <strong style={{ fontSize: 24 }}>
              {totalStudents}명
            </strong>
          </div>

          <div>
            <div style={{ color: "#94a3b8" }}>
              지원 가능
            </div>
            <strong
              style={{
                color: "#4ade80",
                fontSize: 24,
              }}
            >
              {totalEligible}명
            </strong>
          </div>

          <div>
            <div style={{ color: "#94a3b8" }}>
              지원 불가
            </div>
            <strong
              style={{
                color: "#f87171",
                fontSize: 24,
              }}
            >
              {totalIneligible}명
            </strong>
          </div>
        </div>
      </section>

      {/* 지도교수별 집계 */}
      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          지도교수별 명부 집계
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
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
                  "교수 ID",
                  "교수명",
                  "연구자번호",
                  "소속 학과",
                  "참여학생",
                  "요건 O",
                  "요건 X",
                ].map((heading) => (
                  <th key={heading} style={cellStyle}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.profId}>
                  <td style={cellStyle}>
                    {row.profId}
                  </td>

                  {/* 교수명 클릭 시 담당 학생 명부로 이동 */}
                  <td style={cellStyle}>
                    <Link
                      href={`/roster?ym=${encodeURIComponent(
                        ym
                      )}&advisor=${encodeURIComponent(
                        row.profId
                      )}`}
                      style={{
                        color: "#93c5fd",
                        textDecoration: "underline",
                        fontWeight: 600,
                      }}
                    >
                      {row.name}
                    </Link>
                  </td>

                  <td style={cellStyle}>
                    {row.researcherNo}
                  </td>

                  <td style={cellStyle}>
                    {row.dept}
                  </td>

                  <td style={cellStyle}>
                    {row.studentCount}명
                  </td>

                  <td
                    style={{
                      ...cellStyle,
                      color: "#4ade80",
                      fontWeight: 600,
                    }}
                  >
                    {row.eligibleCount}명
                  </td>

                  <td
                    style={{
                      ...cellStyle,
                      color: "#f87171",
                      fontWeight: 600,
                    }}
                  >
                    {row.ineligibleCount}명
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    등록된 지도교수가 없습니다.
                    먼저 학적 연동을 실행해 주세요.
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
