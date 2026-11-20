import "dotenv/config";
import { db } from "./client";
import {
  srcProfessor,
  srcAcademicMonthly,
  srcResearchHistory,
  srcPayment,
  account,
  srcAccountTxn,
  srcAccountSummary,
} from "./schema";
import { STUDENTS, PERIOD, SEEDED_AT, SYSTEM_CODE } from "./seed";
import { addMonths } from "../domain/month";

const EXPECTED_HOST = "stipend-mentoring-euhn5.aws-ap-northeast-1.turso.io";
const APPLY = process.argv.includes("--apply");

function checkDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("libsql://")) {
    throw new Error("이 도구는 원격 Turso DB에서만 실행할 수 있습니다.");
  }
  const host = new URL(url).hostname;
  if (host !== EXPECTED_HOST) {
    throw new Error(`허용되지 않은 데이터베이스: ${host}`);
  }
  if (!process.env.DATABASE_AUTH_TOKEN) {
    throw new Error("DATABASE_AUTH_TOKEN이 없습니다.");
  }
  console.log("연결 대상:", host);
}

// 기존 인수 시나리오와 동일한 학적/연구활동 원천 데이터를 구성한다.
const professors: (typeof srcProfessor.$inferInsert)[] = [
  { profId: "P01", name: "김교수", researcherNo: "10000001", dept: "컴퓨터공학과" },
  { profId: "P02", name: "이교수", researcherNo: "10000002", dept: "전자전기공학과" },
];
const academic: (typeof srcAcademicMonthly.$inferInsert)[] = [];
const history: (typeof srcResearchHistory.$inferInsert)[] = [];
const payments: (typeof srcPayment.$inferInsert)[] = [];

for (const st of STUDENTS) {
  for (let i = st.priorMonths; i >= 1; i--) {
    const ym = addMonths("2026-03", -i);
    history.push({
      srcId: `HIS-${st.studentNo}-${ym}`,
      studentNo: st.studentNo,
      ym,
      activityType: "RND",
    });
  }
  for (const ym of PERIOD) {
    const state = st.state(ym);
    academic.push({
      srcId: `ACAD-${ym}-${st.studentNo}`,
      baseYm: ym,
      studentNo: st.studentNo,
      name: st.name,
      degree: st.degree,
      researcherNo: st.researcherNo,
      originUniv: st.originUniv,
      dept: st.dept,
      acadStatus: state.acadStatus,
      semesterNo: st.semesterNo,
      advisorId: st.advisorId,
      fulltimeYn: state.fulltimeYn,
      activityType: state.activityType,
      updatedAt: SEEDED_AT,
    });
    history.push({
      srcId: `HIS-${st.studentNo}-${ym}`,
      studentNo: st.studentNo,
      ym,
      activityType: state.activityType,
    });
    for (const [fundCode, amount] of st.pays(ym)) {
      payments.push({
        srcId: `PAY-${ym}-${st.studentNo}-${fundCode}`,
        systemCode: SYSTEM_CODE[fundCode],
        baseYm: ym,
        studentNo: st.studentNo,
        fundCode,
        amount,
        paidDate: `${ym}-25`,
        updatedAt: SEEDED_AT,
      });
    }
  }
}

// 원래 seed.ts의 S10 오류 검증용 지급 2건도 유지한다.
payments.push(
  {
    srcId: "PAY-ERR-1", systemCode: "UNIV", baseYm: "2026-03",
    studentNo: null, fundCode: "F11", amount: 100_000,
    paidDate: "2026-03-25", updatedAt: SEEDED_AT,
  },
  {
    srcId: "PAY-ERR-2", systemCode: "ETC", baseYm: "2026-03",
    studentNo: "2026110010", fundCode: "F99", amount: 50_000,
    paidDate: "2026-03-25", updatedAt: SEEDED_AT,
  },
);

const accounts: (typeof account.$inferInsert)[] = [
  { accountId: "A01", accountName: "대학계정", accountType: "UNIV" },
  { accountId: "A02", accountName: "기관 세부계정(공과대학)", accountType: "SUB" },
];

const transactions: (typeof srcAccountTxn.$inferInsert)[] = [
  { srcId: "TXN-0001", accountId: "A01", txnDate: "2026-01-01", direction: "IN", itemCode: "I_CARRY", sourceItem: "I_CARRY", amount: 5_000_000, memo: "2025년도 잔액 이월" },
  { srcId: "TXN-0002", accountId: "A01", txnDate: "2026-03-02", direction: "IN", itemCode: "I_GOV", sourceItem: "I_GOV", amount: 30_000_000, memo: "2026년 1차 연구생활장려금 교부" },
  { srcId: "TXN-0003", accountId: "A01", txnDate: "2026-03-05", direction: "IN", itemCode: "I_UNIV", sourceItem: "I_UNIV", amount: 10_000_000, memo: "대학 자체예산 전입" },
  { srcId: "TXN-0004", accountId: "A01", txnDate: "2026-03-25", direction: "OUT", itemCode: "O_PAY", sourceItem: "I_GOV", amount: 6_000_000, memo: "3월 학생인건비 지급" },
  { srcId: "TXN-0005", accountId: "A01", txnDate: "2026-04-25", direction: "OUT", itemCode: "O_PAY", sourceItem: "I_GOV", amount: 6_000_000, memo: "4월 학생인건비 지급" },
  { srcId: "TXN-0006", accountId: "A01", txnDate: "2026-06-30", direction: "IN", itemCode: "I_INT", sourceItem: "I_INT", amount: 120_000, memo: "상반기 발생이자" },
  { srcId: "TXN-0101", accountId: "A02", txnDate: "2026-01-01", direction: "IN", itemCode: "I_CARRY", sourceItem: "I_CARRY", amount: 1_000_000, memo: "2025년도 잔액 이월" },
  { srcId: "TXN-0102", accountId: "A02", txnDate: "2026-03-10", direction: "IN", itemCode: "I_PI", sourceItem: "I_PI", amount: 2_000_000, memo: "연구책임자계정 대체" },
  { srcId: "TXN-0103", accountId: "A02", txnDate: "2026-03-25", direction: "OUT", itemCode: "O_PAY", sourceItem: "I_PI", amount: 800_000, memo: "3월 학생인건비 지급" },
];

const summaries: (typeof srcAccountSummary.$inferInsert)[] = [
  { accountId: "A01", baseDate: "2026-06-30", sourceItem: "I_CARRY", inTotal: 5_000_000, outTotal: 0, balance: 5_000_000 },
  { accountId: "A01", baseDate: "2026-06-30", sourceItem: "I_GOV", inTotal: 30_000_000, outTotal: 12_000_000, balance: 18_000_000 },
  { accountId: "A01", baseDate: "2026-06-30", sourceItem: "I_UNIV", inTotal: 10_000_000, outTotal: 0, balance: 10_000_000 },
  { accountId: "A01", baseDate: "2026-06-30", sourceItem: "I_INT", inTotal: 120_000, outTotal: 0, balance: 120_000 },
  { accountId: "A02", baseDate: "2026-06-30", sourceItem: "I_CARRY", inTotal: 1_000_000, outTotal: 0, balance: 1_000_000 },
  { accountId: "A02", baseDate: "2026-06-30", sourceItem: "I_PI", inTotal: 2_000_000, outTotal: 800_000, balance: 1_200_000 },
];

const summaryKey = (row: { accountId: string; baseDate: string; sourceItem: string }) =>
  `${row.accountId}|${row.baseDate}|${row.sourceItem}`;

// 기존에 다른 데이터가 있거나, 같은 기본키의 내용이 다르면 변경 전에 중단한다.
function validateExisting<E extends object, X extends object>(
  label: string,
  existing: E[],
  expected: X[],
  existingKey: (row: E) => string,
  expectedKey: (row: X) => string,
) {
  const expectedMap = new Map(expected.map((row) => [expectedKey(row), row]));
  for (const row of existing) {
    const key = existingKey(row);
    const target = expectedMap.get(key);
    if (!target) throw new Error(`${label}: 데모 외 기존 데이터 발견 (${key})`);
    for (const [field, expectedValue] of Object.entries(target)) {
      const actualValue = (row as Record<string, unknown>)[field];
      if (actualValue !== expectedValue) {
        throw new Error(`${label}: 같은 키에 다른 내용이 존재 (${key}, ${field})`);
      }
    }
  }
  console.log(`${label}: 기존 ${existing.length}건 확인 완료`);
}

async function checkExistingData() {
  validateExisting("지도교수 원천", await db.select().from(srcProfessor), professors, r => r.profId, r => r.profId);
  validateExisting("학적 원천", await db.select().from(srcAcademicMonthly), academic, r => r.srcId, r => r.srcId);
  validateExisting("연구활동 이력", await db.select().from(srcResearchHistory), history, r => r.srcId, r => r.srcId);
  validateExisting("지급 원천", await db.select().from(srcPayment), payments, r => r.srcId, r => r.srcId);
  validateExisting("기관계정", await db.select().from(account), accounts, r => r.accountId, r => r.accountId);
  validateExisting("회계 거래", await db.select().from(srcAccountTxn), transactions, r => r.srcId, r => r.srcId);
  validateExisting("회계 집계", await db.select().from(srcAccountSummary), summaries, summaryKey, summaryKey);
}

async function insertAll() {
  await db.insert(srcProfessor).values(professors).onConflictDoNothing();
  for (let i = 0; i < academic.length; i += 20) {
    await db.insert(srcAcademicMonthly).values(academic.slice(i, i + 20)).onConflictDoNothing();
  }
  for (let i = 0; i < history.length; i += 20) {
    await db.insert(srcResearchHistory).values(history.slice(i, i + 20)).onConflictDoNothing();
  }
  for (let i = 0; i < payments.length; i += 20) {
    await db.insert(srcPayment).values(payments.slice(i, i + 20)).onConflictDoNothing();
  }
  await db.insert(account).values(accounts).onConflictDoNothing();
  await db.insert(srcAccountTxn).values(transactions).onConflictDoNothing();
  await db.insert(srcAccountSummary).values(summaries).onConflictDoNothing();
}

async function main() {
  checkDatabase();
  console.log("\n=== 데모 데이터 계획 ===");
  console.log(`지도교수: ${professors.length}명 / 학생: ${STUDENTS.length}명`);
  console.log(`학적 원천: ${academic.length}건 / 연구활동 이력: ${history.length}건`);
  console.log(`지급 원천: ${payments.length}건 (오류 검증용 2건 포함)`);
  console.log(`기관계정: ${accounts.length}개 / 거래: ${transactions.length}건 / 집계: ${summaries.length}건`);
  console.log(`기준월: ${PERIOD.join(", ")}`);
  if (!APPLY) {
    console.log("\n[미리보기] DB에 접속하거나 데이터를 변경하지 않았습니다.");
    console.log("실제 등록은 --apply 옵션이 필요합니다.");
    return;
  }
  console.log("\n[기존 데이터 사전 확인]");
  await checkExistingData();
  console.log("\n[데모 데이터 등록]");
  await insertAll();
  console.log("완료: 기존 행을 삭제하거나 덮어쓰지 않았습니다.");
  console.log("관리자 계정과 규칙 설정은 변경하지 않았습니다.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
