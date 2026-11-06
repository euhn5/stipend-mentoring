
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { syncLog, syncError, notification } from "@/db/schema";
import type { Tx } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

export type JobCode = "JOB-ACAD" | "JOB-PAY" | "JOB-ACCT";

export type Trigger = "MANUAL" | "SCHEDULE";

export type ErrorCode =
  | "E_REQUIRED"
  | "E_CODE"
  | "E_REF"
  | "E_VALUE";

export type JobContext = {
  tx: Tx;
  syncId: number;
  actor: string;
  read(n?: number): void;
  ok(n?: number): void;
  error(e: {
    srcTable: string;
    srcRefId: string;
    errorCode: ErrorCode;
    message: string;
  }): Promise<void>;
};

export type JobResult = {
  syncId: number;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
};

export async function runJob(
  jobCode: JobCode,
  target: string,
  trigger: Trigger,
  body: (ctx: JobContext) => Promise<void>
): Promise<JobResult> {
  const now = () => new Date().toISOString();

  // 1. 실행 이력 생성
  const [log] = await db
    .insert(syncLog)
    .values({
      jobCode,
      target,
      trigger,
      status: "RUNNING",
      startedAt: now(),
    })
    .returning({ syncId: syncLog.syncId });

  const syncId = log.syncId;
  const actor = `SYSTEM:${jobCode}`;

  let readCnt = 0;
  let okCnt = 0;
  let errCnt = 0;

  // 오류가 있을 경우 관리자 알림 생성
  
  // 오류가 있을 경우 관리자 알림 생성
  async function alertAdmin(message: string) {
    const title = `${jobCode} ${target} 연동 오류`;

    await db.transaction(async (tx) => {
      // 동일한 작업과 대상 기간의 기존 오류 알림 조회
      const [existing] = await tx
        .select()
        .from(notification)
        .where(
          and(
            eq(notification.receiver, "ADMIN"),
            eq(notification.type, "SYNC_ALERT"),
            eq(notification.title, title)
          )
        )
        .limit(1);

      // 이미 알림이 있다면 중복 생성하지 않음
      if (existing) {
        return;
      }

      // 처음 발생한 오류일 때만 알림 생성
      await createNotification(tx, {
        receiver: "ADMIN",
        type: "SYNC_ALERT",
        title,
        body: message,
        link: `/sync?syncId=${syncId}`,
      });
    });
  }


  // 2. 연동 처리
  try {
    await db.transaction(async (tx) => {
      const ctx: JobContext = {
        tx,
        syncId,
        actor,

        read(n = 1) {
          readCnt += n;
        },

        ok(n = 1) {
          okCnt += n;
        },

        async error(e) {
          await tx.insert(syncError).values({
            syncId,
            srcTable: e.srcTable,
            srcRefId: e.srcRefId,
            errorCode: e.errorCode,
            message: e.message,
          });

          errCnt += 1;
        },
      };

      await body(ctx);
    });
  } catch (error) {
    // 트랜잭션 실패 시 내부 변경사항은 롤백됨
    const message =
      error instanceof Error ? error.message : String(error);

    await db
      .update(syncLog)
      .set({
        status: "FAILED",
        readCnt: 0,
        okCnt: 0,
        errCnt: 0,
        message,
        endedAt: now(),
      })
      .where(eq(syncLog.syncId, syncId));

    await alertAdmin(message);

    return { syncId, status: "FAILED" };
  }

  // 3. 결과 상태 결정
  const status = errCnt === 0 ? "SUCCESS" : "PARTIAL";

  await db
    .update(syncLog)
    .set({
      status,
      readCnt,
      okCnt,
      errCnt,
      endedAt: now(),
    })
    .where(eq(syncLog.syncId, syncId));

  // 4. 일부 오류 발생 시 관리자 알림
  if (status === "PARTIAL") {
    await alertAdmin(
      `${jobCode} ${target} 연동 중 오류 ${errCnt}건이 발생했습니다.`
    );
  }

  return { syncId, status };
}
