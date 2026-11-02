import { maskResearcherNo } from "@/lib/format";
import Link from "next/link";
import { db } from "@/db/client";
import { professor } from "@/db/schema";
import { getRoster } from "@/queries/roster";
import { getPayments } from "@/queries/payments";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

type SearchParams = {
  ym?: string;
  view?: string;
};

const money = (value: number) =>
  `${value.toLocaleString("ko-KR")}원`;

const cellStyle = {
  padding: 14,
  borderBottom: "1px solid #334155",
  whiteSpace: "nowrap" as const,
};

export default async function ProfessorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const ym = params.ym || "2026-03";
  const view = params.view === "payments" || params.view === "payment"
    ? "payments"
    : "roster";


  // 로그인 사용자 확인
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // 지도교수는 본인 교수 ID만 조회
  const advisor =
    session.role === "PROF"
      ? session.profId!
      : undefined;

  // 등록된 지도교수 조회
  const professors = await db
    .select()
    .from(professor)
    .then((rows) =>
      session.role === "PROF"
        ? rows.filter((row) => row.profId === advisor)
        : rows
    );

  // 학적 및 지급내역 조회
  const students = await getRoster({ ym, advisor });

  const payments =
    view === "payments"
      ? await getPayments({ ym, advisor })
      : [];

  // 지도교수별 집계
  const rows = professors
    .map((prof) => {
      const myStudents = students.filter(
        (student) => student.advisorId === prof.profId
      );

      const myPayments = payments.filter(
        (payment) => payment.advisorId === prof.profId
      );

      return {
        ...prof,
        studentCount: myStudents.length,

        eligibleCount: myStudents.filter(
          (student) => student.overall === "O"
        ).length,

        ineligibleCount: myStudents.filter(
          (student) => student.overall === "X"
        ).length,

        totalPaid: myPayments.reduce(
          (sum, payment) => sum + payment.totalPaid,
          0
        ),

        shortageCount: myPayments.filter(
          (payment) =>
            payment.shortageAmount !== null &&
            payment.shortageAmount > 0
        ).length,

        totalShortage: myPayments.reduce(
          (sum, payment) =>
            sum + (payment.shortageAmount ?? 0),
          0
        ),
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

  const totalPaid = rows.reduce(
    (sum, row) => sum + row.totalPaid,
    0
  );

  const shortageCount = rows.reduce(
    (sum, row) => sum + row.shortageCount,
    0
  );

  const totalShortage = rows.reduce(
    (sum, row) => sum + row.totalShortage,
    0
  );

  const tabStyle = (active: boolean) => ({
    display: "inline-block",
    padding: "12px 22px",
    color: active ? "#93c5fd" : "#94a3b8",
    fontWeight: active ? 700 : 400,
    borderBottom: active
      ? "3px solid #60a5fa"
      : "3px solid transparent",
  });

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        지도교수별 현황
      </h1>

      <p style={{ marginTop: 8, color: "#94a3b8" }}>
        지도교수별 학생 명부와 연구지원금 지급 현황을
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
          action="/professors"
          method="get"
          style={{
            display: "flex",
            gap: 12,
            alignItems: "end",
            marginTop: 20,
          }}
        >
          <input type="hidden" name="view" value={view} />

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

      {/* 명부 / 지급 전환 */}
      <nav
        style={{
          display: "flex",
          gap: 12,
          marginTop: 28,
          borderBottom: "1px solid #475569",
        }}
      >
        <Link
          href={`/professors?ym=${encodeURIComponent(ym)}&view=roster`}
          style={tabStyle(view === "roster")}
        >
          학생 명부
        </Link>

        <Link
          href={`/professors?ym=${encodeURIComponent(ym)}&view=payment`}
          style={tabStyle(view === "payments")}
        >
          지급 현황
        </Link>
      </nav>

      {/* 명부 요약 */}
      {view === "roster" && (
        <section
          style={{
            marginTop: 24,
            padding: 24,
            background: "#1e293b",
            borderRadius: 10,
          }}
        >
          <h2 style={{ fontSize: 20 }}>
            {ym} 지도교수별 명부 요약
          </h2>

          <div
            style={{
              display: "flex",
              gap: 36,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <div>지도교수: <strong>{rows.length}명</strong></div>
            <div>참여학생: <strong>{totalStudents}명</strong></div>
            <div>
              지원 가능:{" "}
              <strong style={{ color: "#4ade80" }}>
                {totalEligible}명
              </strong>
            </div>
            <div>
              지원 불가:{" "}
              <strong style={{ color: "#f87171" }}>
                {totalIneligible}명
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* 지급 요약 */}
      {view === "payments" && (
        <section
          style={{
            marginTop: 24,
            padding: 24,
            background: "#1e293b",
            borderRadius: 10,
          }}
        >
          <h2 style={{ fontSize: 20 }}>
            {ym} 지도교수별 지급 요약
          </h2>

          <div
            style={{
              display: "flex",
              gap: 36,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <div>
              참여학생: <strong>{totalStudents}명</strong>
            </div>
            <div>
              총지급액: <strong>{money(totalPaid)}</strong>
            </div>
            <div>
              부족 학생:{" "}
              <strong style={{ color: "#f87171" }}>
                {shortageCount}명
              </strong>
            </div>
            <div>
              부족금액 합계:{" "}
              <strong style={{ color: "#f87171" }}>
                {money(totalShortage)}
              </strong>
            </div>
          </div>
        </section>
      )}

      {/* 교수별 집계 테이블 */}
      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          지도교수별 {view === "roster" ? "명부" : "지급"} 집계
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
                  ...(view === "roster"
                    ? ["요건 O", "요건 X"]
                    : ["총지급액", "부족 학생", "부족금액"]),
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
                  <td style={cellStyle}>{row.profId}</td>

                  <td style={cellStyle}>
                    <Link
                      href={
                        view === "roster"
                          ? `/roster?ym=${encodeURIComponent(ym)}&advisor=${encodeURIComponent(row.profId)}`
                          : `/payments?ym=${encodeURIComponent(ym)}&advisor=${encodeURIComponent(row.profId)}`
                      }
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
                    {maskResearcherNo(row.researcherNo)}
                  </td>
                  <td style={cellStyle}>{row.dept}</td>
                  <td style={cellStyle}>{row.studentCount}명</td>

                  {view === "roster" ? (
                    <>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#4ade80",
                        }}
                      >
                        {row.eligibleCount}명
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#f87171",
                        }}
                      >
                        {row.ineligibleCount}명
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={cellStyle}>
                        {money(row.totalPaid)}
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#f87171",
                        }}
                      >
                        {row.shortageCount}명
                      </td>
                      <td
                        style={{
                          ...cellStyle,
                          color: "#f87171",
                        }}
                      >
                        {money(row.totalShortage)}
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={view === "roster" ? 7 : 8}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    등록된 지도교수가 없습니다.
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
