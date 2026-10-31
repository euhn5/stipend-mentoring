import { describe, it, expect, beforeEach } from 'vitest';
import { seedAll } from '@/db/seed';
import { db } from '@/db/client';
import { srcAcademicMonthly, auditLog } from '@/db/schema';
import { count } from 'drizzle-orm';
import { recordAudit } from '@/lib/audit';

describe('통합 테스트 환경', () => {
  beforeEach(async () => { await seedAll(); });
  it('test.db에 시드가 들어간다', async () => {
    expect(process.env.DATABASE_URL).toBe('file:test.db');
    const [r] = await db.select({ n: count() }).from(srcAcademicMonthly);
    expect(r.n).toBe(66);
  });
  it('트랜잭션 안에서 감사로그를 남긴다', async () => {
    await db.transaction(async (tx) => {
      await recordAudit(tx, { tableName: 't', rowKey: 'k', action: 'C', after: { a: 1 }, actor: 'test' });
    });
    const [r] = await db.select({ n: count() }).from(auditLog);
    expect(r.n).toBe(1);
  });
});
