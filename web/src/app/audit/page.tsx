
import { and, desc, eq, gte, lte, like } from "drizzle-orm";

import { db } from "@/db/client";
import { auditLog } from "@/db/schema";

type SearchParams = {
  table?: string;
  from?: string;
  to?: string;
  actor?: string;
};

type AuditRow = typeof auditLog.$inferSelect;

const tableOptions = [
  "professor",
  "student_monthly",
  "eligibility_result",
  "payment",
  "account_ledger",
  "payment_plan",
  "rule_config",
];

const inputStyle = {
  padding: 10,
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #475569",
  borderRadius: 6,
};

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #334155",
  whiteSpace: "nowrap" as const,
};

// 감사로그에 저장된 JSON 안전하게 읽기
function parseJson(value: string | null): Record<string, unknown> {
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
    // 오래되거나 잘못된 JSON도 화면 오류 없이 처리
  }

  return {};
}

function formatValue(value: unknown): string {
  if (value === undefined) return "-";
  if (value === null) return "null";

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

// 변경 전후의 필드별 차이 표시
function AuditDiff({ log }: { log: AuditRow }) {
  const before = parseJson(log.beforeJson);
  const after = parseJson(log.afterJson);

  const fields = [
    ...new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ]),
  ].sort();

  return (
    <div style={{ overflowX: "auto", marginTop: 12 }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          textAlign: "left",
        }}
      >
        <thead>
          <tr style={{ background: "#0f172a" }}>
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
          {fields.map((field) => {
            const beforeValue = before[field];
            const afterValue = after[field];

            const changed =
              JSON.stringify(beforeValue) !==
              JSON.stringify(afterValue);

            return (
              <tr
                key={field}
                style={{
                  background: changed
                    ? "#31211e"
                    : "transparent",
                }}
              >
                <td
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #334155",
                    fontWeight: changed ? 700 : 400,
                  }}
                >
                  {field}
                  {changed && (
                    <span
                      style={{
                        color: "#fbbf24",
                        marginLeft: 8,
                      }}
                    >
                      변경
                    </span>
                  )}
                </td>

                <td
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #334155",
                    color: changed ? "#fca5a5" : "#cbd5e1",
                    overflowWrap: "anywhere",
                  }}
                >
                  {formatValue(beforeValue)}
                </td>

                <td
                  style={{
                    padding: 10,
                    borderBottom: "1px solid #334155",
                    color: changed ? "#86efac" : "#cbd5e1",
                    overflowWrap: "anywhere",
                  }}
                >
                  {formatValue(afterValue)}
                </td>
              </tr>
            );
          })}

          {fields.length === 0 && (
            <tr>
              <td
                colSpan={3}
                style={{
                  padding: 16,
                  color: "#94a3b8",
                }}
              >
                비교할 JSON 데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function actionLabel(action: string) {
  if (action === "C") return "생성 (C)";
  if (action === "U") return "수정 (U)";
  if (action === "D") return "삭제 (D)";
  return action;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const table = params.table || "";
  const actor = params.actor?.trim() || "";
  const from = params.from || "";
  const to = params.to || "";

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  // 필터를 선택하지 않으면 전체 감사로그 조회
  const conditions = [];

  if (table) {
    conditions.push(eq(auditLog.tableName, table));
  }

  if (actor) {
    conditions.push(like(auditLog.actor, `%${actor}%`));
  }

  // actedAt은 ISO UTC로 저장됨
  // 화면의 날짜 필터는 한국 날짜 기준
  if (datePattern.test(from)) {
    const start = new Date(
      `${from}T00:00:00+09:00`
    ).toISOString();

    conditions.push(gte(auditLog.actedAt, start));
  }

  if (datePattern.test(to)) {
    const end = new Date(
      `${to}T23:59:59.999+09:00`
    ).toISOString();

    conditions.push(lte(auditLog.actedAt, end));
  }

  const logs = await db
    .select()
    .from(auditLog)
    .where(
      conditions.length > 0
        ? and(...conditions)
        : undefined
    )
    .orderBy(desc(auditLog.logId))
    .limit(100);

  const updateCount = logs.filter(
    (log) => log.action === "U"
  ).length;

  const createCount = logs.filter(
    (log) => log.action === "C"
  ).length;

  const deleteCount = logs.filter(
    (log) => log.action === "D"
  ).length;

  return (
    <main
      style={{
        maxWidth: 1500,
        margin: "0 auto",
        padding: 32,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        감사로그
      </h1>

      <p
        style={{
          marginTop: 8,
          color: "#94a3b8",
        }}
      >
        시스템 데이터 변경 이력을 조회하고,
        변경 전후의 값을 비교합니다.
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
          action="/audit"
          method="get"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "end",
            gap: 12,
            marginTop: 20,
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              대상 테이블
            </span>

            <select
              name="table"
              defaultValue={table}
              style={inputStyle}
            >
              <option value="">전체</option>

              {tableOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              시작일
            </span>

            <input
              name="from"
              type="date"
              defaultValue={from}
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              종료일
            </span>

            <input
              name="to"
              type="date"
              defaultValue={to}
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              작업자
            </span>

            <input
              name="actor"
              type="text"
              defaultValue={actor}
              placeholder="예: SYSTEM:JOB-ACAD"
              style={inputStyle}
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

          <a
            href="/audit"
            style={{
              padding: "11px 16px",
              border: "1px solid #64748b",
              borderRadius: 8,
              color: "#f8fafc",
            }}
          >
            초기화
          </a>
        </form>
      </section>

      {/* 조회 결과 요약 */}
      <section
        style={{
          marginTop: 24,
          padding: 24,
          background: "#1e293b",
          borderRadius: 10,
        }}
      >
        <h2 style={{ fontSize: 20 }}>
          감사로그 조회 결과
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            marginTop: 16,
          }}
        >
          <div>
            조회 건수: <strong>{logs.length}건</strong>
          </div>

          <div>
            생성:{" "}
            <strong style={{ color: "#4ade80" }}>
              {createCount}건
            </strong>
          </div>

          <div>
            수정:{" "}
            <strong style={{ color: "#facc15" }}>
              {updateCount}건
            </strong>
          </div>

          <div>
            삭제:{" "}
            <strong style={{ color: "#f87171" }}>
              {deleteCount}건
            </strong>
          </div>
        </div>

        <p
          style={{
            fontSize: 12,
            color: "#94a3b8",
            marginTop: 12,
          }}
        >
          가장 최근 100건까지 표시합니다.
          위 건수는 현재 조회 결과 기준입니다.
        </p>
      </section>

      {/* 감사로그 목록 */}
      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 20,
            marginBottom: 16,
          }}
        >
          변경 이력 목록
        </h2>

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {logs.map((log) => (
            <details
              key={log.logId}
              style={{
                border: "1px solid #475569",
                borderRadius: 10,
                padding: 16,
                background: "#111827",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    color:
                      log.action === "C"
                        ? "#4ade80"
                        : log.action === "U"
                          ? "#facc15"
                          : "#f87171",
                    marginRight: 12,
                  }}
                >
                  {actionLabel(log.action)}
                </span>

                {log.tableName}

                <span
                  style={{
                    color: "#94a3b8",
                    marginLeft: 12,
                    fontWeight: 400,
                  }}
                >
                  {log.rowKey}
                </span>
              </summary>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 20,
                  marginTop: 16,
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                <span>로그 ID: {log.logId}</span>
                <span>작업자: {log.actor}</span>
                <span>
                  변경 시각:{" "}
                  {new Date(log.actedAt).toLocaleString(
                    "ko-KR",
                    { timeZone: "Asia/Seoul" }
                  )}
                </span>
              </div>

              <AuditDiff log={log} />
            </details>
          ))}

          {logs.length === 0 && (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                border: "1px solid #475569",
                borderRadius: 10,
                color: "#94a3b8",
              }}
            >
              조회 조건에 해당하는 감사로그가 없습니다.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
