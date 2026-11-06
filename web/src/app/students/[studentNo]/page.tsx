import { maskResearcherNo } from "@/lib/format";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq, like, or } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { db } from "@/db/client";
import { auditLog } from "@/db/schema";
import { addMonths } from "@/domain/month";
import { getRoster } from "@/queries/roster";
import { FUND_CODES, getPayments } from "@/queries/payments";

type StudentTab = "info" | "requirements" | "payments" | "history";

type Props = {
  params: Promise<{ studentNo: string }>;
  searchParams: Promise<{ ym?: string; tab?: string }>;
};

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

const money = (value: number) =>
  `${value.toLocaleString("ko-KR")}원`;

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
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
          {description}
        </p>
      </div>
      <strong style={{ color: value === "O" ? "#4ade80" : "#f87171" }}>
        {value}
      </strong>
    </div>
  );
}

// 감사로그의 JSON을 안전하게 변환
function readAuditJson(value: string | null): Record<string, unknown> {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

export default async function StudentPage({
  params,
  searchParams,
}: Props) {
  const { studentNo } = await params;
  const query = await searchParams;

  const ym = query.ym || "2026-03";

  const tab: StudentTab =
    query.tab === "history"
      ? "history"
      : query.tab === "payments"
        ? "payments"
        : query.tab === "requirements"
          ? "requirements"
          : "info";

  // 학생 기본 정보 조회

  // 로그인 사용자 확인
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // 학생 기본 정보 조회
  const students = await getRoster({ ym });
  const student = students.find(
    (row) => row.studentNo === studentNo
  );

  if (!student) {
    notFound();
  }



  // 지도교수는 자신이 담당하는 학생만 조회 가능
  if (
    session.role === "PROF" &&
    student.advisorId !== session.profId
  ) {
    notFound();
  }

  // 기준월부터 6개월 생성


  // 기준월부터 6개월 생성
  const paymentMonths = Array.from(
    { length: 6 },
    (_, index) => addMonths(ym, index)
  );

  // 지급 탭에서만 월별 지급내역 조회
  const paymentHistory =
    tab === "payments"
      ? await Promise.all(
        paymentMonths.map(async (month) => {
          const rows = await getPayments({ ym: month });

          return {
            ym: month,
            payment:
              rows.find((row) => row.studentNo === studentNo) ?? null,
          };
        })
      )
      : [];

  const payment = paymentHistory[0]?.payment ?? null;

  // 6개월 지급액 합계
  const sixMonthTotal = paymentHistory.reduce(
    (sum, item) => sum + (item.payment?.totalPaid ?? 0),
    0
  );

  const sixMonthShortage = paymentHistory.reduce(
    (sum, item) => sum + (item.payment?.shortageAmount ?? 0),
    0
  );

  const sixMonthStandardTotal = paymentHistory.reduce(
    (sum, item) => sum + (item.payment?.standardAmount ?? 0),
    0
  );

  const sixMonthFundTotals = Object.fromEntries(
    FUND_CODES.map((code) => [
      code,
      paymentHistory.reduce(
        (sum, item) => sum + (item.payment?.fundAmounts[code] ?? 0),
        0
      ),
    ])
  ) as Record<(typeof FUND_CODES)[number], number>;

  const sixMonthIntegratedTotal =
    sixMonthFundTotals.F11 +
    sixMonthFundTotals.F12 +
    sixMonthFundTotals.F13;

  // 변경 이력 탭에서만 감사로그 조회

  // 해당 학생의 학적·지원요건·지급 변경 이력
  const history =
    tab === "history"
      ? await db
        .select()
        .from(auditLog)
        .where(
          or(
            // 학적 변경 이력
            and(
              eq(auditLog.tableName, "student_monthly"),
              eq(auditLog.rowKey, `${ym}|${studentNo}`)
            ),

            // 지원요건 판정 변경 이력
            and(
              eq(auditLog.tableName, "eligibility_result"),
              eq(auditLog.rowKey, `${ym}|${studentNo}`)
            ),

            // 지급 변경 이력: 재원별 고유 키에 학번이 포함됨
            and(
              eq(auditLog.tableName, "payment"),
              like(auditLog.rowKey, `PAY-${ym}-${studentNo}-%`)
            )
          )
        )
        .orderBy(desc(auditLog.logId))
      : [];


  // 탭 링크
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
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Link>
    );
  }

  return (
    <main style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <Link
        href={`/roster?ym=${encodeURIComponent(ym)}`}
        style={{ color: "#93c5fd" }}
      >
        ← 학생연구자 명부로 돌아가기
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 24 }}>
        {student.name} 학생 상세
      </h1>

      <p style={{ color: "#94a3b8", marginTop: 8 }}>
        학번 {student.studentNo} · 기준월 {ym}
      </p>

      {/* 학생 기본 정보 */}
      <section style={{ ...cardStyle, marginTop: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>
          학생 기본 정보
        </h2>

        <InfoRow label="학번" value={student.studentNo} />
        <InfoRow label="이름" value={student.name} />
        <InfoRow label="학위" value={student.degree} />
        <InfoRow label="학과" value={student.dept} />
        <InfoRow label="지도교수" value={student.professorName} />
        <InfoRow label="종합 지원자격" value={student.overall} />
      </section>

      {/* 탭 메뉴 */}
      <nav
        style={{
          display: "flex",
          gap: 8,
          marginTop: 32,
          borderBottom: "1px solid #475569",
          overflowX: "auto",
        }}
      >
        <TabLink label="학적" value="info" />
        <TabLink label="지원요건" value="requirements" />
        <TabLink label="지급" value="payments" />
        <TabLink label="변경 이력" value="history" />
      </nav>

      {/* 학적 탭 */}
      {tab === "info" && (
        <section style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>
            학적 정보
          </h2>

          <InfoRow label="연구자번호" value={student.researcherNo
            ? maskResearcherNo(student.researcherNo) : "-"} />
          <InfoRow label="출신대학교" value={student.originUniv} />
          <InfoRow label="학적상태" value={student.acadStatus} />
          <InfoRow label="현재 학기" value={student.semesterNo} />
          <InfoRow label="전일제 여부" value={student.fulltimeYn} />
          <InfoRow label="연구활동 유형" value={student.activityType} />
          <InfoRow label="누적 지원개월" value={student.cumSupportMonths} />
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
            <InfoRow label="종합 지원자격" value={student.overall} />
            <InfoRow label="최대 지원기한" value={student.maxSupportYm} />
            <InfoRow
              label="기준 지급액"
              value={
                student.standardAmount === null
                  ? "-"
                  : money(student.standardAmount)
              }
            />
          </div>
        </section>
      )}

      {/* 지급 탭 */}
      {tab === "payments" && (
        <section style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>
            {ym} 지급내역
          </h2>

          {!payment ? (
            <p style={{ marginTop: 16 }}>
              지급내역을 조회할 수 없습니다.
            </p>
          ) : (
            <>
              <div style={{ marginTop: 16 }}>
                <InfoRow
                  label="총지급액"
                  value={money(payment.totalPaid)}
                />
                <InfoRow
                  label="기준금액"
                  value={
                    payment.standardAmount === null
                      ? "-"
                      : money(payment.standardAmount)
                  }
                />
                <InfoRow
                  label="기준금액 충족"
                  value={payment.meets ?? "-"}
                />
                <InfoRow
                  label="부족금액"
                  value={
                    payment.shortageAmount === null
                      ? "-"
                      : money(payment.shortageAmount)
                  }
                />
              </div>

              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginTop: 28,
                }}
              >
                재원별 지급액
              </h3>

              {FUND_CODES.map((code) => (
                <InfoRow
                  key={code}
                  label={code}
                  value={money(payment.fundAmounts[code])}
                />
              ))}

              <InfoRow
                label="통합관리 소계 (F11+F12+F13)"
                value={money(payment.integratedSubtotal)}
              />

              {/* 정합성 검사 */}
              <div
                style={{
                  marginTop: 24,
                  padding: 20,
                  background: "#0f172a",
                  borderRadius: 8,
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>
                  정합성 검사
                </h3>

                <p
                  style={{
                    marginTop: 12,
                    color: payment.chk04.ok ? "#4ade80" : "#f87171",
                  }}
                >
                  CHK-04: {payment.chk04.ok ? "일치" : "불일치"}
                </p>

                <p
                  style={{
                    marginTop: 8,
                    color: payment.chk05.ok ? "#4ade80" : "#f87171",
                  }}
                >
                  CHK-05: {payment.chk05.ok ? "일치" : "불일치"}
                </p>

                {!payment.chk05.ok && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: "#fca5a5" }}>
                      {payment.chk05.note}
                    </p>

                    {payment.chk05.diffs.map((diff) => (
                      <div
                        key={diff.field}
                        style={{
                          padding: "12px 0",
                          borderBottom: "1px solid #334155",
                        }}
                      >
                        <strong>재원 {diff.field}</strong>
                        <p>
                          본 시스템: {money(Number(diff.ours))}
                        </p>
                        <p>
                          원천 데이터: {money(Number(diff.source))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href={`/payments?ym=${encodeURIComponent(
                  ym
                )}&q=${encodeURIComponent(studentNo)}`}
                style={{
                  display: "inline-block",
                  marginTop: 24,
                  color: "#93c5fd",
                  textDecoration: "underline",
                }}
              >
                전체 지급내역 화면에서 확인
              </Link>

              {/* 6개월 지급내역 */}
              <div style={{ marginTop: 36 }}>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  월별 지급내역 (6개월)
                </h3>

                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  기준월 {ym}부터 6개월간의 재원별 지급액과
                  부족금액입니다. 미연동 월은 금액을
                  표시하지 않습니다.
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
                      minWidth: 1450,
                      borderCollapse: "collapse",
                      textAlign: "right",
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#0f172a" }}>
                        {[
                          "기준월",
                          ...FUND_CODES,
                          "통합관리 소계",
                          "총지급액",
                          "기준금액",
                          "충족",
                          "부족금액",
                        ].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              padding: 12,
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid #475569",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {paymentHistory.map(({ ym: month, payment: row }) => (
                        <tr key={month}>
                          <td
                            style={{
                              padding: 12,
                              whiteSpace: "nowrap",
                              borderBottom: "1px solid #334155",
                            }}
                          >
                            {month}
                          </td>

                          {row ? (
                            <>
                              {FUND_CODES.map((code) => (
                                <td key={code} style={{ padding: 12 }}>
                                  {money(row.fundAmounts[code])}
                                </td>
                              ))}

                              <td style={{ padding: 12 }}>
                                {money(row.integratedSubtotal)}
                              </td>

                              <td
                                style={{
                                  padding: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {money(row.totalPaid)}
                              </td>

                              <td style={{ padding: 12 }}>
                                {row.standardAmount === null
                                  ? "-"
                                  : money(row.standardAmount)}
                              </td>

                              <td
                                style={{
                                  padding: 12,
                                  color:
                                    row.meets === "O"
                                      ? "#4ade80"
                                      : row.meets === "X"
                                        ? "#f87171"
                                        : "#94a3b8",
                                  fontWeight: 700,
                                }}
                              >
                                {row.meets ?? "-"}
                              </td>

                              <td style={{ padding: 12 }}>
                                {row.shortageAmount === null
                                  ? "-"
                                  : money(row.shortageAmount)}
                              </td>
                            </>
                          ) : (
                            <td
                              colSpan={12}
                              style={{
                                padding: 12,
                                color: "#94a3b8",
                                textAlign: "center",
                              }}
                            >
                              해당 월 학적 데이터 없음
                              (연동 여부 확인)
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>

                    {/* 6개월 합계 */}
                    <tfoot>
                      <tr
                        style={{
                          background: "#0f172a",
                          fontWeight: 700,
                          borderTop: "2px solid #60a5fa",
                        }}
                      >
                        <td style={{ padding: 12 }}>
                          6개월 합계
                        </td>

                        {FUND_CODES.map((code) => (
                          <td key={code} style={{ padding: 12 }}>
                            {money(sixMonthFundTotals[code])}
                          </td>
                        ))}

                        <td style={{ padding: 12 }}>
                          {money(sixMonthIntegratedTotal)}
                        </td>

                        <td style={{ padding: 12 }}>
                          {money(sixMonthTotal)}
                        </td>

                        <td style={{ padding: 12 }}>
                          {money(sixMonthStandardTotal)}
                        </td>

                        <td style={{ padding: 12 }}>-</td>

                        <td
                          style={{
                            padding: 12,
                            color: "#f87171",
                          }}
                        >
                          {money(sixMonthShortage)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* 변경 이력 탭 */}
      {tab === "history" && (
        <section style={{ ...cardStyle, marginTop: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>
            학생 데이터 변경 이력
          </h2>

          <p
            style={{
              marginTop: 8,
              marginBottom: 20,
              color: "#94a3b8",
            }}
          >
            {ym} · {student.name} · 총 {history.length}건
          </p>

          {history.map((log) => {
            const before = readAuditJson(log.beforeJson);
            const after = readAuditJson(log.afterJson);

            const fields = [
              ...new Set([
                ...Object.keys(before),
                ...Object.keys(after),
              ]),
            ];

            const changedFields = fields.filter(
              (field) =>
                field !== "syncedAt" &&
                JSON.stringify(before[field]) !==
                JSON.stringify(after[field])
            );


            return (
              <details
                key={log.logId}
                style={{
                  border: "1px solid #475569",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  background: "#0f172a",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      color:
                        log.action === "U"
                          ? "#facc15"
                          : log.action === "C"
                            ? "#4ade80"
                            : "#f87171",
                    }}
                  >
                    {log.action === "U"
                      ? "수정"
                      : log.action === "C"
                        ? "생성"
                        : "삭제"}
                  </span>

                  {" · "}
                  로그 #{log.logId}
                  {" · "}
                  {new Date(log.actedAt).toLocaleString(
                    "ko-KR",
                    { timeZone: "Asia/Seoul" }
                  )}
                </summary>

                <p
                  style={{
                    marginTop: 12,
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  작업자: {log.actor}
                </p>

                <div
                  style={{
                    overflowX: "auto",
                    marginTop: 12,
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr>
                        {["필드", "변경 전", "변경 후"].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              padding: 10,
                              borderBottom: "1px solid #475569",
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {changedFields.map((field) => (
                        <tr key={field}>
                          <td
                            style={{
                              padding: 10,
                              color: "#facc15",
                            }}
                          >
                            {field}
                          </td>

                          <td
                            style={{
                              padding: 10,
                              color: "#fca5a5",
                            }}
                          >
                            {before[field] == null
                              ? "-"
                              : String(before[field])}
                          </td>

                          <td
                            style={{
                              padding: 10,
                              color: "#86efac",
                            }}
                          >
                            {after[field] == null
                              ? "-"
                              : String(after[field])}
                          </td>
                        </tr>
                      ))}

                      {changedFields.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            style={{
                              padding: 12,
                              color: "#94a3b8",
                            }}
                          >
                            변경된 필드가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}

          {history.length === 0 && (
            <p style={{ color: "#94a3b8" }}>
              해당 학생의 변경 이력이 없습니다.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
