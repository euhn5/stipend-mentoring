
import Link from "next/link";
import { getRoster } from "@/queries/roster";
import type { CheckResult } from "@/domain/checks";

type SearchParams = {
  ym?: string;
  degree?: string;
  dept?: string;
  advisor?: string;
  overall?: string;
  q?: string;
};

// CHK-01~03 일치 여부 표시
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
        }}
      >
        {label}: 불일치
      </summary>

      <div
        style={{
          marginTop: 8,
          padding: 10,
          borderRadius: 6,
          background: "#1e293b",
          fontSize: 12,
          minWidth: 230,
        }}
      >
        {result.note && <p>{result.note}</p>}

        {result.diffs.map((diff) => (
          <div key={diff.field} style={{ marginTop: 6 }}>
            <strong>{diff.field}</strong>
            <div>본 시스템: {String(diff.ours ?? "-")}</div>
            <div>원천/기대값: {String(diff.source ?? "-")}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

// O / X 색상 표시
function Status({ value }: { value: string }) {
  return (
    <strong
      style={{
        color: value === "O" ? "#4ade80" : "#f87171",
      }}
    >
      {value}
    </strong>
  );
}

export default async function RosterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const ym = params.ym || "2026-03";

  const overall =
    params.overall === "O" || params.overall === "X"
      ? params.overall
      : undefined;

  // 1. 전체 명부: 필터 선택지 생성
  const allRows = await getRoster({ ym });

  // 2. 검색 조건 적용
  const rows = await getRoster({
    ym,
    degree: params.degree || undefined,
    dept: params.dept || undefined,
    advisor: params.advisor || undefined,
    overall,
    q: params.q || undefined,
  });

  // 학위 목록
  const degrees = [
    ...new Set(allRows.map((r) => r.degree)),
  ].sort();

  // 학과 목록
  const departments = [
    ...new Set(allRows.map((r) => r.dept)),
  ].sort();

  // 지도교수 목록
  const advisors = [
    ...new Map(
      allRows.map((r) => [
        r.advisorId,
        {
          id: r.advisorId,
          name: r.professorName || r.advisorId,
        },
      ])
    ).values(),
  ];

  // 입력창 스타일
  const inputStyle = {
    padding: "10px",
    border: "1px solid #475569",
    borderRadius: 6,
    background: "#0f172a",
    color: "#f8fafc",
    minWidth: 120,
  };

  // 테이블 셀 스타일
  const cellStyle = {
    padding: "12px",
    borderBottom: "1px solid #334155",
    whiteSpace: "nowrap" as const,
  };

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      {/* 페이지 제목 */}
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        학생연구자 명부
      </h1>

      <p
        style={{
          marginTop: 8,
          color: "#94a3b8",
        }}
      >
        학생별 학적, 지도교수, 지원요건 및 원천 데이터 정합성을
        확인합니다.
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
          action="/roster"
          style={{
            display: "flex",
            gap: 12,
            alignItems: "end",
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          {/* 기준월 */}
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

          {/* 학위 */}
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              학위
            </span>

            <select
              name="degree"
              defaultValue={params.degree || ""}
              style={inputStyle}
            >
              <option value="">전체</option>

              {degrees.map((degree) => (
                <option key={degree} value={degree}>
                  {degree}
                </option>
              ))}
            </select>
          </label>

          {/* 학과 */}
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              학과
            </span>

            <select
              name="dept"
              defaultValue={params.dept || ""}
              style={inputStyle}
            >
              <option value="">전체</option>

              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>

          {/* 지도교수 */}
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

          {/* 종합 판정 */}
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              종합 판정
            </span>

            <select
              name="overall"
              defaultValue={overall || ""}
              style={inputStyle}
            >
              <option value="">전체</option>
              <option value="O">
                O (지원 가능)
              </option>
              <option value="X">
                X (지원 불가)
              </option>
            </select>
          </label>

          {/* 이름 / 학번 검색 */}
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
              placeholder="검색어 입력"
              style={inputStyle}
            />
          </label>

          {/* 조회 버튼 */}
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

          {/* 필터 초기화 */}
          <Link
            href={`/roster?ym=${encodeURIComponent(ym)}`}
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

      {/* 조회 결과 요약 */}
      <section
        style={{
          marginTop: 24,
          padding: 20,
          background: "#1e293b",
          borderRadius: 10,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {ym} 학생연구자 현황
        </h2>

        <p style={{ marginTop: 10 }}>
          조회 인원:{" "}
          <strong>{rows.length}명</strong>
          {" · "}
          종합 O:{" "}
          <strong style={{ color: "#4ade80" }}>
            {
              rows.filter(
                (r) => r.overall === "O"
              ).length
            }
            명
          </strong>
          {" · "}
          종합 X:{" "}
          <strong style={{ color: "#f87171" }}>
            {
              rows.filter(
                (r) => r.overall === "X"
              ).length
            }
            명
          </strong>
        </p>
      </section>

      {/* 명부 조회 결과 */}
      <section style={{ marginTop: 28 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          명부 조회 결과
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
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
                  "학과",
                  "지도교수",
                  "학적상태",
                  "R1",
                  "R2",
                  "R3",
                  "R4",
                  "종합",
                  "최대 지원기한",
                  "CHK-01",
                  "CHK-02",
                  "CHK-03",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={cellStyle}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.baseYm}-${row.studentNo}`}
                >
                  {/* 학번 */}
                  <td style={cellStyle}>
                    {row.studentNo}
                  </td>

                  {/* 이름: 클릭 시 학생 상세 페이지 이동 */}
                  <td style={cellStyle}>
                    <Link
                      href={`/students/${encodeURIComponent(
                        row.studentNo
                      )}?ym=${encodeURIComponent(
                        ym
                      )}&tab=info`}
                      style={{
                        color: "#93c5fd",
                        textDecoration: "underline",
                        fontWeight: 600,
                      }}
                    >
                      {row.name}
                    </Link>
                  </td>

                  {/* 기본 학적 정보 */}
                  <td style={cellStyle}>
                    {row.degree}
                  </td>

                  <td style={cellStyle}>
                    {row.dept}
                  </td>

                  <td style={cellStyle}>
                    {row.professorName || "-"}
                  </td>

                  <td style={cellStyle}>
                    {row.acadStatus}
                  </td>

                  {/* 지원요건 R1~R4 */}
                  <td style={cellStyle}>
                    <Status value={row.r1Status} />
                  </td>

                  <td style={cellStyle}>
                    <Status value={row.r2Fulltime} />
                  </td>

                  <td style={cellStyle}>
                    <Status value={row.r3Activity} />
                  </td>

                  <td style={cellStyle}>
                    <Status value={row.r4Period} />
                  </td>

                  {/* 종합 지원자격 */}
                  <td style={cellStyle}>
                    <Status value={row.overall} />
                  </td>

                  {/* 최대 지원기한 */}
                  <td style={cellStyle}>
                    {row.maxSupportYm || "-"}
                  </td>

                  {/* CHK-01~03 정합성 검사 */}
                  <td style={cellStyle}>
                    <CheckCell
                      label="CHK-01"
                      result={row.chk01}
                    />
                  </td>

                  <td style={cellStyle}>
                    <CheckCell
                      label="CHK-02"
                      result={row.chk02}
                    />
                  </td>

                  <td style={cellStyle}>
                    <CheckCell
                      label="CHK-03"
                      result={row.chk03}
                    />
                  </td>
                </tr>
              ))}

              {/* 조회 결과 없음 */}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={15}
                    style={{
                      padding: 30,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    조회된 학생이 없습니다.
                    해당 기준월의 학적 연동 여부를 확인해 주세요.
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
