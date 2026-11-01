
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { notification } from "@/db/schema";
import { readNotification } from "./actions";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

const dateFormat = (date: string) =>
  new Date(date).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
  });

function typeName(type: string) {
  switch (type) {
    case "ACAD_STATUS_CHANGED":
      return "학적 상태 변경";
    case "REQ_DETAIL_CHANGED":
      return "지원요건 변경";
    case "ELIGIBILITY_CHANGED":
      return "지원자격 변경";
    case "SYNC_ALERT":
      return "연동 오류";
    default:
      return type;
  }
}

export default async function NotificationsPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const unreadOnly = params.filter === "unread";

  // 로그인 기능 구현 전이므로 전체 수신자의 알림을 조회
  const allNotifications = await db
    .select()
    .from(notification)
    .orderBy(desc(notification.createdAt), desc(notification.notiId));

  const unreadCount = allNotifications.filter(
    (item) => item.readYn === "N"
  ).length;

  const rows = unreadOnly
    ? allNotifications.filter((item) => item.readYn === "N")
    : allNotifications;

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        알림함
      </h1>

      <p style={{ marginTop: 8, color: "#94a3b8" }}>
        학적, 지원자격 변경과 연동 오류 알림을 확인합니다.
      </p>

      <section
        style={{
          marginTop: 28,
          padding: 24,
          borderRadius: 10,
          background: "#1e293b",
        }}
      >
        <h2 style={{ fontSize: 20 }}>알림 현황</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 32,
            marginTop: 16,
          }}
        >
          <div>
            <span style={{ color: "#94a3b8" }}>
              전체 알림
            </span>
            <p style={{ fontSize: 26, fontWeight: 700 }}>
              {allNotifications.length}건
            </p>
          </div>

          <div>
            <span style={{ color: "#94a3b8" }}>
              안 읽은 알림
            </span>
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#facc15",
              }}
            >
              {unreadCount}건
            </p>
          </div>
        </div>
      </section>

      <nav
        style={{
          display: "flex",
          gap: 20,
          marginTop: 28,
          marginBottom: 20,
          borderBottom: "1px solid #475569",
        }}
      >
        <a
          href="/notifications"
          style={{
            padding: "12px 8px",
            color: !unreadOnly ? "#93c5fd" : "#94a3b8",
            borderBottom: !unreadOnly
              ? "3px solid #60a5fa"
              : "3px solid transparent",
          }}
        >
          전체 ({allNotifications.length})
        </a>

        <a
          href="/notifications?filter=unread"
          style={{
            padding: "12px 8px",
            color: unreadOnly ? "#93c5fd" : "#94a3b8",
            borderBottom: unreadOnly
              ? "3px solid #60a5fa"
              : "3px solid transparent",
          }}
        >
          안 읽음 ({unreadCount})
        </a>
      </nav>

      <div style={{ display: "grid", gap: 12 }}>
        {rows.map((noti) => {
          const unread = noti.readYn === "N";

          return (
            <form
              key={noti.notiId}
              action={readNotification}
            >
              <input
                type="hidden"
                name="notiId"
                value={noti.notiId}
              />

              <button
                type="submit"
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: 20,
                  borderRadius: 10,
                  border: unread
                    ? "1px solid #60a5fa"
                    : "1px solid #334155",
                  background: unread
                    ? "#1e293b"
                    : "#111827",
                  color: "#f8fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: unread
                          ? "#facc15"
                          : "#94a3b8",
                        fontSize: 13,
                        marginRight: 12,
                      }}
                    >
                      {unread ? "● 안 읽음" : "읽음"}
                    </span>

                    <span
                      style={{
                        color: "#93c5fd",
                        fontSize: 13,
                      }}
                    >
                      {typeName(noti.type)}
                    </span>
                  </div>

                  <span
                    style={{
                      color: "#94a3b8",
                      fontSize: 13,
                    }}
                  >
                    {dateFormat(noti.createdAt)}
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: unread ? 700 : 500,
                    marginTop: 12,
                  }}
                >
                  {noti.title}
                </h2>

                <p
                  style={{
                    marginTop: 8,
                    color: "#cbd5e1",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {noti.body}
                </p>

                <p
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                    color: "#94a3b8",
                  }}
                >
                  수신자: {noti.receiver}
                </p>

                <p
                  style={{
                    marginTop: 10,
                    color: "#93c5fd",
                    fontSize: 13,
                  }}
                >
                  클릭하여 읽음 처리 및 관련 화면 이동
                </p>
              </button>
            </form>
          );
        })}

        {rows.length === 0 && (
          <div
            style={{
              padding: 36,
              border: "1px solid #475569",
              borderRadius: 10,
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            {unreadOnly
              ? "안 읽은 알림이 없습니다."
              : "생성된 알림이 없습니다."}
          </div>
        )}
      </div>
    </main>
  );
}
