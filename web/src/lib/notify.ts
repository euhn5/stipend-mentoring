
import type { Tx } from "@/lib/audit";
import { notification } from "@/db/schema";

export type NotificationType =
  | "ACAD_STATUS_CHANGED"
  | "REQ_DETAIL_CHANGED"
  | "ELIGIBILITY_CHANGED"
  | "SYNC_ALERT";

export type NotificationInput = {
  receiver: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
};

/**
 * 알림을 notification 테이블에 저장한다.
 *
 * 반드시 호출자가 전달한 트랜잭션(tx)을 사용한다.
 */
export async function createNotification(
  tx: Tx,
  n: NotificationInput
): Promise<void> {
  await tx.insert(notification).values({
    receiver: n.receiver,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link ?? null,
    readYn: "N",
    createdAt: new Date().toISOString(),
  });
}
