
import "dotenv/config";
import { db } from "./client";
import {
  srcProfessor,
  srcAcademicMonthly,
  srcResearchHistory,
} from "./schema";
import { STUDENTS, PERIOD, SEEDED_AT } from "./seed";
import { addMonths } from "../domain/month";

const EXPECTED_HOST =
  "stipend-mentoring-euhn5.aws-ap-northeast-1.turso.io";

const APPLY = process.argv.includes("--apply");

// 1. 운영 DB 연결 대상 확인
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

// 2. 기존 시나리오에서 학적 원천 데이터 생성
const professors: (typeof srcProfessor.$inferInsert)[] = [
  {
    profId: "P01",
    name: "김교수",
    researcherNo: "10000001",
    dept: "컴퓨터공학과",
  },
  {
    profId: "P02",
    name: "이교수",
    researcherNo: "10000002",
    dept: "전자전기공학과",
  },
];

const academic: (typeof srcAcademicMonthly.$inferInsert)[] = [];
const history: (typeof srcResearchHistory.$inferInsert)[] = [];

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
  }
}

// 3. 대량 데이터를 나눠서 등록
async function insertBatches<T>(
  table: typeof srcAcademicMonthly | typeof srcResearchHistory,
  rows: T[],
  batchSize = 20,
) {
  // 테이블별 타입 차이를 피하기 위해 실제 삽입은 main에서 수행한다.
  return { table, rows, batchSize };
}

async function insertAcademic() {
  for (let i = 0; i < academic.length; i += 20) {
    await db
      .insert(srcAcademicMonthly)
      .values(academic.slice(i, i + 20))
      .onConflictDoNothing();
  }
}

async function insertHistory() {
  for (let i = 0; i < history.length; i += 20) {
    await db
      .insert(srcResearchHistory)
      .values(history.slice(i, i + 20))
      .onConflictDoNothing();
  }
}

// 4. 실행
async function main() {
  checkDatabase();

  console.log("\n=== 데모 학적 데이터 ===");
  console.log(`지도교수: ${professors.length}명`);
  console.log(`학생: ${STUDENTS.length}명`);
  console.log(`학적 원천 행: ${academic.length}건`);
  console.log(`연구활동 이력: ${history.length}건`);
  console.log(`기준월: ${PERIOD.join(", ")}`);

  if (!APPLY) {
    console.log("\n[미리보기 모드]");
    console.log("데이터베이스는 변경하지 않았습니다.");
    console.log("실제 등록은 --apply 옵션이 필요합니다.");
    return;
  }

  // 기존 운영 데이터와 섞이지 않도록 사전 검사
  const existingProfessors = await db.select().from(srcProfessor);
  const existingAcademic = await db.select().from(srcAcademicMonthly);
  const existingHistory = await db.select().from(srcResearchHistory);

  const professorIds = new Set(professors.map((p) => p.profId));
  const academicIds = new Set(academic.map((a) => a.srcId));
  const historyIds = new Set(history.map((h) => h.srcId));

  if (
    existingProfessors.some((p) => !professorIds.has(p.profId)) ||
    existingAcademic.some((a) => !academicIds.has(a.srcId)) ||
    existingHistory.some((h) => !historyIds.has(h.srcId))
  ) {
    throw new Error(
      "데모 데이터 외의 기존 원천 데이터가 발견되어 등록을 중단했습니다.",
    );
  }

  console.log("\n[데이터 등록 시작]");

  await db.insert(srcProfessor).values(professors).onConflictDoNothing();
  await insertAcademic();
  await insertHistory();

  console.log("데모 학적 원천 데이터 등록 완료");
  console.log("관리자 계정과 규칙 설정은 변경하지 않았습니다.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
