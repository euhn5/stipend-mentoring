
import { sql } from "drizzle-orm";

import { db } from "../src/db/client";
import {
  professor,
  ruleConfig,
  studentMonthly,
  eligibilityResult,
  srcAcademicMonthly,
  srcResearchHistory,
  payment,
  srcPayment,
} from "../src/db/schema";

const STUDENT_COUNT = 2000;
const MONTHS = [
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
];

const BATCH_SIZE = 20;
const NOW = "2026-03-01T00:00:00.000Z";

// 운영 DB 또는 기존 테스트 DB 실행 방지
function assertBenchmarkDatabase() {
  if (
    process.env.DATABASE_URL !== "file:benchmark.db" ||
    process.env.DATABASE_AUTH_TOKEN
  ) {
    throw new Error(
      "성능 테스트는 인증 토큰이 없는 file:benchmark.db에서만 실행할 수 있습니다."
    );
  }
}

// 기존 데이터 덮어쓰기 방지
async function assertEmptyDatabase() {
  const tables = [
    professor,
    ruleConfig,
    studentMonthly,
    eligibilityResult,
    srcAcademicMonthly,
    srcResearchHistory,
    payment,
    srcPayment,
  ];

  for (const table of tables) {
    const [result] = await db
      .select({ total: sql<number>`count(*)` })
      .from(table);

    if (Number(result.total) !== 0) {
      throw new Error(
        "성능 테스트 DB에 기존 데이터가 있습니다. 실행을 중단합니다."
      );
    }
  }
}

async function insertBatches<T>(
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>
) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await insert(rows.slice(i, i + BATCH_SIZE));
  }
}

async function main() {
  assertBenchmarkDatabase();
  await assertEmptyDatabase();

  console.log("성능 테스트 데이터 생성 시작");

  // 교수 정보
  await db.insert(professor).values([
    {
      profId: "P01",
      name: "성능테스트교수1",
      researcherNo: "90000001",
      dept: "컴퓨터공학과",
    },
    {
      profId: "P02",
      name: "성능테스트교수2",
      researcherNo: "90000002",
      dept: "전자전기공학과",
    },
  ]);

  // 지원요건 판정에 필요한 규칙
  const rules: (typeof ruleConfig.$inferInsert)[] = [
    ["eligible.acad_status", "재학"],
    ["eligible.fulltime_yn", "Y"],
    ["eligible.activity_types", "RND,LAB"],
    ["max_months.석사", "24"],
    ["max_months.박사", "48"],
    ["max_months.석박통합", "72"],
    ["standard_amount.석사", "800000"],
    ["standard_amount.박사", "1100000"],
    ["standard_amount.석박통합.early", "800000"],
    ["standard_amount.석박통합.late", "1100000"],
    ["integrated.late_from_semester", "5"],
  ].map(([key, value]) => ({
    key,
    value,
    description: "성능 측정용 규칙",
  }));

  await db.insert(ruleConfig).values(rules);

  // 테이블별 데이터 준비
  const students: (typeof studentMonthly.$inferInsert)[] = [];
  const eligibilities: (typeof eligibilityResult.$inferInsert)[] = [];
  const academics: (typeof srcAcademicMonthly.$inferInsert)[] = [];
  const histories: (typeof srcResearchHistory.$inferInsert)[] = [];
  const payments: (typeof payment.$inferInsert)[] = [];
  const sourcePayments: (typeof srcPayment.$inferInsert)[] = [];

  for (let i = 1; i <= STUDENT_COUNT; i++) {
    const studentNo = `B${String(i).padStart(7, "0")}`;
    const name = `성능학생${i}`;
    const advisorId = i % 2 === 0 ? "P01" : "P02";
    const dept =
      i % 2 === 0 ? "컴퓨터공학과" : "전자전기공학과";
    const researcherNo = `9${String(i).padStart(7, "0")}`;

    for (const [index, ym] of MONTHS.entries()) {
      const common = {
        baseYm: ym,
        studentNo,
        name,
        degree: "석사",
        researcherNo,
        originUniv: "성능테스트대학교",
        dept,
        acadStatus: "재학",
        semesterNo: 1,
        advisorId,
        fulltimeYn: "Y",
        activityType: "RND",
      };

      students.push({
        ...common,
        cumSupportMonths: index + 1,
        syncedAt: NOW,
      });

      academics.push({
        srcId: `AC-${ym}-${studentNo}`,
        ...common,
        updatedAt: NOW,
      });

      eligibilities.push({
        baseYm: ym,
        studentNo,
        r1Status: "O",
        r2Fulltime: "O",
        r3Activity: "O",
        r4Period: "O",
        maxSupportYm: "2028-02",
        overall: "O",
        standardAmount: 800000,
        judgedAt: NOW,
      });

      histories.push({
        srcId: `H-${ym}-${studentNo}`,
        studentNo,
        ym,
        activityType: "RND",
      });

      for (const [fundCode, amount] of [
        ["F11", 500000],
        ["F20", 300000],
      ] as const) {
        const srcId = `PAY-${ym}-${studentNo}-${fundCode}`;

        sourcePayments.push({
          srcId,
          baseYm: ym,
          studentNo,
          fundCode,
          systemCode: fundCode === "F11" ? "UNIV" : "RND",
          amount,
          paidDate: `${ym}-20`,
          updatedAt: NOW,
        });

        payments.push({
          baseYm: ym,
          studentNo,
          fundCode,
          amount,
          paidDate: `${ym}-20`,
          srcRefId: srcId,
        });
      }
    }
  }

  console.log("데이터 준비 완료. DB 저장 시작");

  await insertBatches(students, async (batch) => {
    await db.insert(studentMonthly).values(batch);
  });

  await insertBatches(eligibilities, async (batch) => {
    await db.insert(eligibilityResult).values(batch);
  });

  await insertBatches(academics, async (batch) => {
    await db.insert(srcAcademicMonthly).values(batch);
  });

  await insertBatches(histories, async (batch) => {
    await db.insert(srcResearchHistory).values(batch);
  });

  await insertBatches(payments, async (batch) => {
    await db.insert(payment).values(batch);
  });

  await insertBatches(sourcePayments, async (batch) => {
    await db.insert(srcPayment).values(batch);
  });

  console.log("성능 테스트 데이터 생성 완료");
  console.log(`학생 수: ${STUDENT_COUNT}`);
  console.log(`기준월 수: ${MONTHS.length}`);
  console.log(`학생 월별 학적: ${students.length}건`);
  console.log(`지원요건 판정: ${eligibilities.length}건`);
  console.log(`원천 학적: ${academics.length}건`);
  console.log(`연구활동 이력: ${histories.length}건`);
  console.log(`지급내역: ${payments.length}건`);
  console.log(`원천 지급내역: ${sourcePayments.length}건`);
}

main().catch((error) => {
  console.error("성능 테스트 데이터 생성 실패:", error);
  process.exitCode = 1;
});
