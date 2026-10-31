
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { syncLog } from "@/db/schema";
import { runSyncAction } from "./actions";

export default async function SyncPage({
  searchParams,
}: {
  searchParams: Promise<{ syncId?: string }>;
}) {
  const params = await searchParams;
  const selectedId = Number(params.syncId);

  const logs = await db
    .select()
    .from(syncLog)
    .orderBy(desc(syncLog.syncId))
    .limit(30);

  const selectedLog = Number.isInteger(selectedId)
    ? logs.find((log) => log.syncId === selectedId)
    : undefined;

  return (
    <main style={{ padding: "32px", maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        연동관리
      </h1>

      <p style={{ marginTop: 8, color: "#64748b" }}>
        학적 데이터를 연동하고 실행 결과를 확인합니다.
      </p>

      <section
        style={{
          marginTop: 28,
          padding: 24,
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>
          수동 연동 실행
        </h2>

        <form
          action={runSyncAction}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "end",
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              연동 작업
            </span>
            <select
              name="jobCode"
              defaultValue="JOB-ACAD"
              style={{ padding: 10, border: "1px solid #cbd5e1" }}
            >
              <option value="JOB-ACAD">JOB-ACAD (학적)</option>
            </select>
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              기준월
            </span>
            <input
              name="target"
              type="month"
              defaultValue="2026-03"
              required
              style={{ padding: 10, border: "1px solid #cbd5e1" }}
            />
          </label>

          <button
            type="submit"
            style={{
              padding: "11px 20px",
              background: "#2563eb",
              color: "white",
              border: 0,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            연동 실행
          </button>
        </form>
      </section>

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
          <h2 style={{ fontWeight: 700 }}>최근 실행 결과</h2>
          <p style={{ marginTop: 12 }}>
            {selectedLog.jobCode} / {selectedLog.target}
          </p>
          <p>
            상태: <strong>{selectedLog.status}</strong>
          </p>
          <p>
            읽음 {selectedLog.readCnt} / 성공 {selectedLog.okCnt} /
            오류 {selectedLog.errCnt}
          </p>
          {selectedLog.message && <p>{selectedLog.message}</p>}
        </section>
      )}

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>
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
              <tr style={{ background: "#1e293b", color: "#f8fafc" }}>
                {[
                  "실행 ID",
                  "작업",
                  "기준월",
                  "상태",
                  "읽음",
                  "성공",
                  "오류",
                  "실행 방식",
                  "시작 시각",
                ].map((heading) => (
                  <th
                    key={heading}
                    style={{ padding: 12, borderBottom: "1px solid #ddd" }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {logs.map((log) => (
                <tr key={log.syncId}>
                  <td style={{ padding: 12 }}>{log.syncId}</td>
                  <td style={{ padding: 12 }}>{log.jobCode}</td>
                  <td style={{ padding: 12 }}>{log.target}</td>
                  <td style={{ padding: 12 }}>{log.status}</td>
                  <td style={{ padding: 12 }}>{log.readCnt}</td>
                  <td style={{ padding: 12 }}>{log.okCnt}</td>
                  <td style={{ padding: 12 }}>{log.errCnt}</td>
                  <td style={{ padding: 12 }}>{log.trigger}</td>
                  <td style={{ padding: 12 }}>{log.startedAt}</td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 24, textAlign: "center" }}>
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
