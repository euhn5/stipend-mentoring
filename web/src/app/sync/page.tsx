
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { syncLog, syncError } from "@/db/schema";
import SyncForm from "./SyncForm";

export default async function SyncPage({
  searchParams,
}: {
  searchParams: Promise<{ syncId?: string }>;
}) {
  const params = await searchParams;
  const selectedId = Number(params.syncId);

  // 1. 최근 연동 실행 이력 30건 조회
  const logs = await db
    .select()
    .from(syncLog)
    .orderBy(desc(syncLog.syncId))
    .limit(30);

  // 2. 사용자가 선택한 연동 실행 결과 조회
  const selectedLog =
    params.syncId && Number.isInteger(selectedId)
      ? (
          await db
            .select()
            .from(syncLog)
            .where(eq(syncLog.syncId, selectedId))
        )[0]
      : undefined;

  // 3. 선택한 연동 실행의 오류 상세 조회
  const selectedErrors = selectedLog
    ? await db
        .select()
        .from(syncError)
        .where(eq(syncError.syncId, selectedLog.syncId))
    : [];

  return (
    <main
      style={{
        padding: "32px",
        maxWidth: 1100,
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
        연동관리
      </h1>

      <p
        style={{
          marginTop: 8,
          color: "#94a3b8",
        }}
      >
        학적, 지급 및 기관계정 데이터를 연동하고 실행 결과를 확인합니다.
      </p>

      {/* 수동 연동 실행 */}
      <section
        style={{
          marginTop: 28,
          padding: 24,
          border: "1px solid #475569",
          borderRadius: 12,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          수동 연동 실행
        </h2>

        <SyncForm />
      </section>

      {/* 선택한 실행 결과 */}
      {selectedLog && (
        <section
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 10,
            background: "#1e293b",
            color: "#f8fafc",
          }}
        >
          <h2 style={{ fontWeight: 700 }}>
            실행 결과 (ID: {selectedLog.syncId})
          </h2>

          <p style={{ marginTop: 12 }}>
            {selectedLog.jobCode} / {selectedLog.target}
          </p>

          <p>
            상태:{" "}
            <strong
              style={{
                color:
                  selectedLog.status === "SUCCESS"
                    ? "#4ade80"
                    : selectedLog.status === "PARTIAL"
                    ? "#facc15"
                    : selectedLog.status === "FAILED"
                    ? "#f87171"
                    : "#f8fafc",
              }}
            >
              {selectedLog.status}
            </strong>
          </p>

          <p>
            읽음 {selectedLog.readCnt} / 성공 {selectedLog.okCnt} /
            오류 {selectedLog.errCnt}
          </p>

          {selectedLog.message && (
            <p style={{ marginTop: 8 }}>
              {selectedLog.message}
            </p>
          )}
        </section>
      )}

      {/* 선택한 실행의 오류 상세 */}
      {selectedLog && selectedErrors.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            연동 오류 상세 ({selectedErrors.length}건)
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
                    "오류 ID",
                    "원천 테이블",
                    "원천 ID",
                    "오류 코드",
                    "오류 메시지",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: 12,
                        borderBottom: "1px solid #475569",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {selectedErrors.map((error) => (
                  <tr
                    key={error.errId}
                    style={{
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    <td style={{ padding: 12 }}>
                      {error.errId}
                    </td>

                    <td style={{ padding: 12 }}>
                      {error.srcTable}
                    </td>

                    <td style={{ padding: 12 }}>
                      {error.srcRefId}
                    </td>

                    <td
                      style={{
                        padding: 12,
                        color: "#f87171",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {error.errorCode}
                    </td>

                    <td style={{ padding: 12 }}>
                      {error.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 오류가 없는 실행 */}
      {selectedLog &&
        selectedErrors.length === 0 &&
        selectedLog.status === "SUCCESS" && (
          <p
            style={{
              marginTop: 16,
              color: "#4ade80",
            }}
          >
            연동 오류가 없습니다.
          </p>
        )}

      {/* 연동 실행 이력 */}
      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          연동 실행 이력
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
                  "실행 ID",
                  "작업",
                  "기준월 / 기간",
                  "상태",
                  "읽음",
                  "성공",
                  "오류",
                  "실행 방식",
                  "시작 시각",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: 12,
                      borderBottom: "1px solid #475569",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.syncId}
                  style={{
                    borderBottom: "1px solid #334155",
                    background:
                      selectedLog?.syncId === log.syncId
                        ? "#172554"
                        : "transparent",
                  }}
                >
                  {/* 클릭 가능한 실행 ID */}
                  <td style={{ padding: 12 }}>
                    <Link
                      href={`/sync?syncId=${log.syncId}`}
                      style={{
                        color: "#93c5fd",
                        textDecoration: "underline",
                        fontWeight: 600,
                      }}
                    >
                      {log.syncId}
                    </Link>
                  </td>

                  <td style={{ padding: 12 }}>
                    {log.jobCode}
                  </td>

                  <td
                    style={{
                      padding: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {log.target}
                  </td>

                  <td style={{ padding: 12 }}>
                    <strong
                      style={{
                        color:
                          log.status === "SUCCESS"
                            ? "#4ade80"
                            : log.status === "PARTIAL"
                            ? "#facc15"
                            : log.status === "FAILED"
                            ? "#f87171"
                            : "#f8fafc",
                      }}
                    >
                      {log.status}
                    </strong>
                  </td>

                  <td style={{ padding: 12 }}>
                    {log.readCnt}
                  </td>

                  <td style={{ padding: 12 }}>
                    {log.okCnt}
                  </td>

                  <td style={{ padding: 12 }}>
                    {log.errCnt}
                  </td>

                  <td style={{ padding: 12 }}>
                    {log.trigger}
                  </td>

                  <td
                    style={{
                      padding: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {new Date(log.startedAt).toLocaleString(
                      "ko-KR",
                      {
                        timeZone: "Asia/Seoul",
                      }
                    )}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 24,
                      textAlign: "center",
                    }}
                  >
                    연동 실행 이력이 없습니다.
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
