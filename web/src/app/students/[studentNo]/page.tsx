
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRoster } from "@/queries/roster";

type StudentTab = "info" | "requirements";

type Props = {
  params: Promise<{ studentNo: string }>;
  searchParams: Promise<{
    ym?: string;
    tab?: string;
  }>;
};

export default async function StudentPage({
  params,
  searchParams,
}: Props) {
  const { studentNo } = await params;
  const query = await searchParams;

  const ym = query.ym || "2026-03";

  const tab: StudentTab =
    query.tab === "requirements"
      ? "requirements"
      : "info";

  // 해당 기준월의 학생 명부 조회
  const rows = await getRoster({ ym });

  // 학번으로 정확하게 일치하는 학생 검색
  const student = rows.find(
    (row) => row.studentNo === studentNo
  );

  if (!student) {
    notFound();
  }

  const cardStyle = {
    background: "#1e293b",
    borderRadius: 10,
    padding: 24,
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "12px 0",
    borderBottom: "1px solid #334155",
  };

  function InfoRow({
    label,
    value,
  }: {
    label: string;
    value: string | number | null;
  }) {
    return (
      <div style={rowStyle}>
        <span style={{ color: "#94a3b8" }}>{label}</span>
        <strong>{value ?? "-"}</strong>
      </div>
    );
  }

  function RequirementRow({
    label,
    value,
    description,
  }: {
    label: string;
    value: string;
    description: string;
  }) {
    return (
      <div style={rowStyle}>
        <div>
          <strong>{label}</strong>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            {description}
          </p>
        </div>

        <strong
          style={{
            color: value === "O" ? "#4ade80" : "#f87171",
          }}
        >
          {value}
        </strong>
      </div>
    );
  }

  function TabLink({
    label,
    value,
  }: {
    label: string;
    value: StudentTab;
  }) {
    const selected = tab === value;

    return (
      <Link
        href={`/students/${encodeURIComponent(
          studentNo
        )}?ym=${encodeURIComponent(ym)}&tab=${value}`}
        style={{
          padding: "12px 20px",
          borderBottom: selected
            ? "3px solid #60a5fa"
            : "3px solid transparent",
          color: selected ? "#93c5fd" : "#94a3b8",
          fontWeight: selected ? 700 : 400,
        }}
      >
        {label}
      </Link>
    );
  }

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* 명부로 돌아가기 */}
      <Link
        href={`/roster?ym=${encodeURIComponent(ym)}`}
        style={{ color: "#93c5fd" }}
      >
        ← 학생연구자 명부로 돌아가기
      </Link>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginTop: 24,
        }}
      >
        {student.name} 학생 상세
      </h1>

      <p
        style={{
          color: "#94a3b8",
          marginTop: 8,
        }}
      >
        학번 {student.studentNo} · 기준월 {ym}
      </p>

      {/* 학생 요약 카드 */}
      <section
        style={{
          ...cardStyle,
          marginTop: 24,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          학생 기본 정보
        </h2>

        <InfoRow label="학번" value={student.studentNo} />
        <InfoRow label="이름" value={student.name} />
        <InfoRow label="학위" value={student.degree} />
        <InfoRow label="학과" value={student.dept} />
        <InfoRow
          label="지도교수"
          value={student.professorName}
        />
        <InfoRow
          label="종합 지원자격"
          value={student.overall}
        />
      </section>

      {/* 탭 메뉴 */}
      <nav
        style={{
          display: "flex",
          gap: 8,
          marginTop: 32,
          borderBottom: "1px solid #475569",
        }}
      >
        <TabLink label="학적" value="info" />
        <TabLink label="지원요건" value="requirements" />

        <span
          style={{
            padding: "12px 20px",
            color: "#64748b",
          }}
        >
          지급 (Step 9)
        </span>

        <span
          style={{
            padding: "12px 20px",
            color: "#64748b",
          }}
        >
          변경 이력 (Step 11)
        </span>
      </nav>

      {/* 학적 탭 */}
      {tab === "info" && (
        <section style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>
            학적 정보
          </h2>

          <InfoRow
            label="연구자번호"
            value={student.researcherNo}
          />
          <InfoRow
            label="출신대학교"
            value={student.originUniv}
          />
          <InfoRow
            label="학적상태"
            value={student.acadStatus}
          />
          <InfoRow
            label="현재 학기"
            value={student.semesterNo}
          />
          <InfoRow
            label="전일제 여부"
            value={student.fulltimeYn}
          />
          <InfoRow
            label="연구활동 유형"
            value={student.activityType}
          />
          <InfoRow
            label="누적 지원개월"
            value={student.cumSupportMonths}
          />
        </section>
      )}

      {/* 지원요건 탭 */}
      {tab === "requirements" && (
        <section style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>
            지원요건 판정
          </h2>

          <RequirementRow
            label="R1 · 학적상태"
            value={student.r1Status}
            description="지원 가능한 학적상태인지 확인"
          />

          <RequirementRow
            label="R2 · 전일제"
            value={student.r2Fulltime}
            description="전일제 참여 여부 확인"
          />

          <RequirementRow
            label="R3 · 연구활동"
            value={student.r3Activity}
            description="인정되는 연구활동 유형인지 확인"
          />

          <RequirementRow
            label="R4 · 지원기간"
            value={student.r4Period}
            description="최대 지원기간 초과 여부 확인"
          />

          <div
            style={{
              marginTop: 24,
              padding: 20,
              borderRadius: 8,
              background: "#0f172a",
            }}
          >
            <InfoRow
              label="종합 지원자격"
              value={student.overall}
            />
            <InfoRow
              label="최대 지원기한"
              value={student.maxSupportYm}
            />
            <InfoRow
              label="기준 지급액"
              value={
                student.standardAmount === null
                  ? "-"
                  : `${student.standardAmount.toLocaleString(
                      "ko-KR"
                    )}원`
              }
            />
          </div>
        </section>
      )}
    </main>
  );
}
