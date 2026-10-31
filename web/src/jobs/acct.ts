
import { and, eq, gte, lte } from "drizzle-orm";

import {
  srcAccountTxn,
  account,
  accountLedger,
} from "@/db/schema";

import { LEDGER_ITEMS } from "@/lib/codes";
import { recordAudit } from "@/lib/audit";
import { runJob } from "./run";
import type { Trigger, JobResult } from "./run";

/**
 * JOB-ACCT: 기관계정 거래내역 연동
 */
export async function runAcctJob(
  from: string,
  to: string,
  trigger: Trigger
): Promise<JobResult> {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    from > to
  ) {
    throw new Error("올바른 날짜 범위를 입력해 주세요.");
  }

  return runJob(
    "JOB-ACCT",
    `${from}~${to}`,
    trigger,
    async (ctx) => {
      const { tx, actor } = ctx;
      const validSourceIds = new Set<string>();

      // 1. 기간 내 원천 거래 조회
      const sourceRows = await tx
        .select()
        .from(srcAccountTxn)
        .where(
          and(
            gte(srcAccountTxn.txnDate, from),
            lte(srcAccountTxn.txnDate, to)
          )
        );

      for (const row of sourceRows) {
        ctx.read();

        // 2. 필수값 검사
        if (
          !row.accountId ||
          !row.txnDate ||
          !row.direction ||
          !row.itemCode ||
          !row.sourceItem ||
          row.amount === null ||
          row.amount === undefined
        ) {
          await ctx.error({
            srcTable: "src_account_txn",
            srcRefId: row.srcId,
            errorCode: "E_REQUIRED",
            message: "필수 거래정보가 누락되었습니다.",
          });
          continue;
        }

        // 3. 거래 방향 및 항목 코드 검사
        const item = LEDGER_ITEMS.find(
          (entry) => entry.code === row.itemCode
        );

        const sourceItemValid = LEDGER_ITEMS.some(
          (entry) =>
            entry.code === row.sourceItem &&
            entry.code.startsWith("I_")
        );

        if (
          !["IN", "OUT"].includes(row.direction) ||
          !item ||
          item.direction !== row.direction ||
          !sourceItemValid
        ) {
          await ctx.error({
            srcTable: "src_account_txn",
            srcRefId: row.srcId,
            errorCode: "E_CODE",
            message: "거래 방향 또는 회계 항목 코드가 올바르지 않습니다.",
          });
          continue;
        }

        // 4. 기관계정 참조 검사
        const [savedAccount] = await tx
          .select()
          .from(account)
          .where(eq(account.accountId, row.accountId));

        if (!savedAccount) {
          await ctx.error({
            srcTable: "src_account_txn",
            srcRefId: row.srcId,
            errorCode: "E_REF",
            message: `존재하지 않는 기관계정: ${row.accountId}`,
          });
          continue;
        }

        // 5. 금액 및 수입 출처 검사
        if (
          row.amount <= 0 ||
          (
            row.direction === "IN" &&
            row.sourceItem !== row.itemCode
          )
        ) {
          await ctx.error({
            srcTable: "src_account_txn",
            srcRefId: row.srcId,
            errorCode: "E_VALUE",
            message: "거래금액 또는 수입 출처가 올바르지 않습니다.",
          });
          continue;
        }

        validSourceIds.add(row.srcId);

        const values = {
          accountId: row.accountId,
          txnDate: row.txnDate,
          direction: row.direction,
          itemCode: row.itemCode,
          sourceItem: row.sourceItem,
          amount: row.amount,
          memo: row.memo,
          srcRefId: row.srcId,
        };

        // 6. 기존 원장 거래 조회
        const [existing] = await tx
          .select()
          .from(accountLedger)
          .where(eq(accountLedger.srcRefId, row.srcId));

        if (!existing) {
          // 신규 거래 생성
          await tx.insert(accountLedger).values(values);

          await recordAudit(tx, {
            tableName: "account_ledger",
            rowKey: row.srcId,
            action: "C",
            after: values,
            actor,
          });
        } else {
          // 기존 거래와 비교
          const changed = Object.entries(values).some(
            ([field, value]) =>
              existing[field as keyof typeof existing] !== value
          );

          if (changed) {
            await tx
              .update(accountLedger)
              .set(values)
              .where(eq(accountLedger.srcRefId, row.srcId));

            await recordAudit(tx, {
              tableName: "account_ledger",
              rowKey: row.srcId,
              action: "U",
              before: existing,
              after: { ...existing, ...values },
              actor,
            });
          }
        }

        ctx.ok();
      }

      // 7. 원천에서 사라진 거래 삭제
      const existingRows = await tx
        .select()
        .from(accountLedger)
        .where(
          and(
            gte(accountLedger.txnDate, from),
            lte(accountLedger.txnDate, to)
          )
        );

      for (const saved of existingRows) {
        if (validSourceIds.has(saved.srcRefId)) {
          continue;
        }

        await tx
          .delete(accountLedger)
          .where(eq(accountLedger.txnId, saved.txnId));

        await recordAudit(tx, {
          tableName: "account_ledger",
          rowKey: saved.srcRefId,
          action: "D",
          before: saved,
          actor,
        });
      }
    }
  );
}
