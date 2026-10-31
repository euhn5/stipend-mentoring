import { db } from '@/db/client';
import { auditLog } from '@/db/schema';

/** db.transaction 콜백이 받는 트랜잭션 객체의 타입 */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function recordAudit(
  tx: Tx,
  e: { tableName: string; rowKey: string; action: 'C' | 'U' | 'D'; before?: object | null; after?: object | null; actor: string },
) {
  await tx.insert(auditLog).values({
    tableName: e.tableName,
    rowKey: e.rowKey,
    action: e.action,
    beforeJson: e.before ? JSON.stringify(e.before) : null,
    afterJson: e.after ? JSON.stringify(e.after) : null,
    actor: e.actor,
    actedAt: new Date().toISOString(),
  });
}
