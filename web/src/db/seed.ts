// 시드 데이터 — docs/요구사항.md 9장 인수 시나리오
//
// 실행: npm run db:seed (또는 npm run db:reset). 통합 테스트에서는 seedAll()을 import 해서 쓴다.
// 동작: 모든 테이블을 비운 뒤 Mock 원천(src_), 기관계정 마스터, 규칙 설정값을 넣는다.
//       본 시스템 테이블(student_monthly, payment, account_ledger 등)은 비워 둔다.
//       이 테이블들은 연동 Job을 실행해야 채워진다.
// 여러 번 실행해도 결과가 같다.

import 'dotenv/config';
import { db } from './client';
import * as s from './schema';
import { addMonths } from '../domain/month';

// 테스트용 시드는 로컬 SQLite에서만 실행할 수 있다.
function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";

  if (!url.startsWith("file:")) {
    throw new Error(
      "안전상의 이유로 원격 데이터베이스에서는 시드를 실행할 수 없습니다."
    );
  }
}

export const SEEDED_AT = '2026-03-01T00:00:00.000Z';
export const PERIOD = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];

type Pay = [fundCode: string, amount: number];
type MonthState = { acadStatus: string; fulltimeYn: string; activityType: string };

type StudentSpec = {
  key: string; // 시나리오 ID (S01 ~ S11)
  studentNo: string;
  name: string;
  degree: '석사' | '박사' | '석박통합';
  researcherNo: string;
  originUniv: string;
  dept: string;
  semesterNo: number;
  advisorId: string;
  priorMonths: number; // 2026-03 이전 연구활동(RND/LAB) 개월 수
  state: (ym: string) => MonthState;
  pays: (ym: string) => Pay[];
};

const normal: MonthState = { acadStatus: '재학', fulltimeYn: 'Y', activityType: 'RND' };
const always = (p: Pay[]) => () => p;

export const STUDENTS: StudentSpec[] = [
  {
    key: 'S01', studentNo: '2023210001', name: '김민준', degree: '박사', researcherNo: '20000001',
    originUniv: '동국대학교', dept: '컴퓨터공학과', semesterNo: 5, advisorId: 'P01', priorMonths: 24,
    state: () => normal,
    pays: always([['F11', 600_000], ['F20', 600_000]]),
  },
  {
    key: 'S02', studentNo: '2025110002', name: '이서연', degree: '석사', researcherNo: '20000002',
    originUniv: '동국대학교', dept: '컴퓨터공학과', semesterNo: 3, advisorId: 'P01', priorMonths: 12,
    state: () => normal,
    pays: always([['F11', 500_000]]),
  },
  {
    key: 'S03', studentNo: '2025110003', name: '박지훈', degree: '석사', researcherNo: '20000003',
    originUniv: '동국대학교', dept: '컴퓨터공학과', semesterNo: 3, advisorId: 'P01', priorMonths: 12,
    state: (ym) => (ym >= '2026-05' ? { acadStatus: '휴학', fulltimeYn: 'Y', activityType: 'NONE' } : normal),
    pays: (ym) => (ym >= '2026-05' ? [] : [['F11', 800_000]]),
  },
  {
    key: 'S04', studentNo: '2024210004', name: '최수아', degree: '박사', researcherNo: '20000004',
    originUniv: '동국대학교', dept: '전자전기공학과', semesterNo: 5, advisorId: 'P02', priorMonths: 24,
    state: () => ({ ...normal, fulltimeYn: 'N' }),
    pays: always([['F20', 700_000]]),
  },
  {
    key: 'S05', studentNo: '2025310005', name: '정도윤', degree: '석박통합', researcherNo: '20000005',
    originUniv: '동국대학교', dept: '전자전기공학과', semesterNo: 4, advisorId: 'P02', priorMonths: 18,
    state: () => ({ ...normal, activityType: 'LAB' }),
    pays: always([['F11', 400_000], ['F30', 400_000]]),
  },
  {
    key: 'S06', studentNo: '2025110006', name: '강하은', degree: '석사', researcherNo: '20000006',
    originUniv: '동국대학교', dept: '전자전기공학과', semesterNo: 4, advisorId: 'P02', priorMonths: 21,
    state: () => normal,
    pays: (ym) => (ym >= '2026-06' ? [['F20', 300_000]] : [['F11', 800_000]]),
  },
  {
    key: 'S07', studentNo: '2024210007', name: '조현우', degree: '박사', researcherNo: '20000007',
    originUniv: '동국대학교', dept: '컴퓨터공학과', semesterNo: 5, advisorId: 'P01', priorMonths: 24,
    state: () => normal,
    pays: always([['F11', 600_000], ['F13', 500_000]]),
  },
  {
    key: 'S08', studentNo: '2025210008', name: '윤지아', degree: '박사', researcherNo: '20000008',
    originUniv: '동국대학교', dept: '전자전기공학과', semesterNo: 3, advisorId: 'P02', priorMonths: 12,
    state: () => normal,
    pays: (ym) => (ym === '2026-04' ? [] : [['F11', 1_100_000]]),
  },
  {
    key: 'S09', studentNo: '2025110009', name: '임태윤', degree: '석사', researcherNo: '20000009',
    originUniv: '경북대학교', dept: '전자전기공학과', semesterNo: 3, advisorId: 'P02', priorMonths: 12,
    state: () => normal,
    pays: always([['F12', 800_000]]),
  },
  {
    key: 'S10', studentNo: '2026110010', name: '한예린', degree: '석사', researcherNo: '20000010',
    originUniv: '동국대학교', dept: '컴퓨터공학과', semesterNo: 1, advisorId: 'P01', priorMonths: 0,
    state: () => ({ ...normal, activityType: 'LAB' }),
    pays: always([['F40', 500_000], ['F90', 300_000]]),
  },
  {
    key: 'S11', studentNo: '2024310011', name: '오세훈', degree: '석박통합', researcherNo: '20000011',
    originUniv: '동국대학교', dept: '컴퓨터공학과', semesterNo: 5, advisorId: 'P01', priorMonths: 24,
    state: () => normal,
    pays: always([['F11', 1_100_000]]),
  },
];

export const SYSTEM_CODE: Record<string, string> = {
  F11: 'UNIV', F12: 'UNIV', F13: 'UNIV', F20: 'RND', F30: 'BK21', F40: 'GOV', F90: 'ETC', F99: 'ETC',
};

async function clearAll() {
  // 자식 테이블부터 지운다 (FK 순서)
  const tables = [
    s.syncError, s.syncLog, s.notification, s.auditLog,
    s.eligibilityResult, s.studentMonthly, s.appUser, s.professor,
    s.payment, s.paymentPlan, s.accountLedger, s.account, s.ruleConfig,
    s.srcProfessor, s.srcAcademicMonthly, s.srcResearchHistory,
    s.srcPayment, s.srcAccountTxn, s.srcAccountSummary,
  ];
  for (const t of tables) await db.delete(t);
}

async function seedRules() {
  await db.insert(s.ruleConfig).values([
    { key: 'eligible.acad_status', value: '재학', description: 'R1: 충족으로 인정하는 학적상태' },
    { key: 'eligible.fulltime_yn', value: 'Y', description: 'R2: 충족으로 인정하는 전일제 값' },
    { key: 'eligible.activity_types', value: 'RND,LAB', description: 'R3: 충족으로 인정하는 연구활동 유형 (쉼표 구분)' },
    { key: 'max_months.석사', value: '24', description: 'R4: 석사 최대지원개월' },
    { key: 'max_months.박사', value: '48', description: 'R4: 박사 최대지원개월' },
    { key: 'max_months.석박통합', value: '72', description: 'R4: 석박통합 최대지원개월' },
    { key: 'standard_amount.석사', value: '800000', description: '석사 월 기준금액(원)' },
    { key: 'standard_amount.박사', value: '1100000', description: '박사 월 기준금액(원)' },
    { key: 'standard_amount.석박통합.early', value: '800000', description: '석박통합 박사단계 전 월 기준금액(원)' },
    { key: 'standard_amount.석박통합.late', value: '1100000', description: '석박통합 박사단계 월 기준금액(원)' },
    { key: 'integrated.late_from_semester', value: '5', description: '석박통합에서 박사 기준금액을 적용하기 시작하는 학기차' },
  ]);
}

async function seedAcademic() {
  await db.insert(s.srcProfessor).values([
    { profId: 'P01', name: '김교수', researcherNo: '10000001', dept: '컴퓨터공학과' },
    { profId: 'P02', name: '이교수', researcherNo: '10000002', dept: '전자전기공학과' },
  ]);

  const academic: (typeof s.srcAcademicMonthly.$inferInsert)[] = [];
  const history: (typeof s.srcResearchHistory.$inferInsert)[] = [];

  for (const st of STUDENTS) {
    // 2026-03 이전 이력: 직전 priorMonths 개월 동안 연구활동
    for (let i = st.priorMonths; i >= 1; i--) {
      const ym = addMonths('2026-03', -i);
      history.push({ srcId: `HIS-${st.studentNo}-${ym}`, studentNo: st.studentNo, ym, activityType: 'RND' });
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
      history.push({ srcId: `HIS-${st.studentNo}-${ym}`, studentNo: st.studentNo, ym, activityType: state.activityType });
    }
  }
  await db.insert(s.srcAcademicMonthly).values(academic);
  await db.insert(s.srcResearchHistory).values(history);
}

async function seedPayments() {
  const rows: (typeof s.srcPayment.$inferInsert)[] = [];
  for (const st of STUDENTS) {
    for (const ym of PERIOD) {
      for (const [fundCode, amount] of st.pays(ym)) {
        rows.push({
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
  // S10 시나리오: 연동 오류를 일으키는 행 2건
  rows.push(
    { srcId: 'PAY-ERR-1', systemCode: 'UNIV', baseYm: '2026-03', studentNo: null, fundCode: 'F11', amount: 100_000, paidDate: '2026-03-25', updatedAt: SEEDED_AT },
    { srcId: 'PAY-ERR-2', systemCode: 'ETC', baseYm: '2026-03', studentNo: '2026110010', fundCode: 'F99', amount: 50_000, paidDate: '2026-03-25', updatedAt: SEEDED_AT },
  );
  await db.insert(s.srcPayment).values(rows);
}

async function seedAccounts() {
  await db.insert(s.account).values([
    { accountId: 'A01', accountName: '대학계정', accountType: 'UNIV' },
    { accountId: 'A02', accountName: '기관 세부계정(공과대학)', accountType: 'SUB' },
  ]);

  await db.insert(s.srcAccountTxn).values([
    { srcId: 'TXN-0001', accountId: 'A01', txnDate: '2026-01-01', direction: 'IN', itemCode: 'I_CARRY', sourceItem: 'I_CARRY', amount: 5_000_000, memo: '2025년도 잔액 이월' },
    { srcId: 'TXN-0002', accountId: 'A01', txnDate: '2026-03-02', direction: 'IN', itemCode: 'I_GOV', sourceItem: 'I_GOV', amount: 30_000_000, memo: '2026년 1차 연구생활장려금 교부' },
    { srcId: 'TXN-0003', accountId: 'A01', txnDate: '2026-03-05', direction: 'IN', itemCode: 'I_UNIV', sourceItem: 'I_UNIV', amount: 10_000_000, memo: '대학 자체예산 전입' },
    { srcId: 'TXN-0004', accountId: 'A01', txnDate: '2026-03-25', direction: 'OUT', itemCode: 'O_PAY', sourceItem: 'I_GOV', amount: 6_000_000, memo: '3월 학생인건비 지급' },
    { srcId: 'TXN-0005', accountId: 'A01', txnDate: '2026-04-25', direction: 'OUT', itemCode: 'O_PAY', sourceItem: 'I_GOV', amount: 6_000_000, memo: '4월 학생인건비 지급' },
    { srcId: 'TXN-0006', accountId: 'A01', txnDate: '2026-06-30', direction: 'IN', itemCode: 'I_INT', sourceItem: 'I_INT', amount: 120_000, memo: '상반기 발생이자' },
    { srcId: 'TXN-0101', accountId: 'A02', txnDate: '2026-01-01', direction: 'IN', itemCode: 'I_CARRY', sourceItem: 'I_CARRY', amount: 1_000_000, memo: '2025년도 잔액 이월' },
    { srcId: 'TXN-0102', accountId: 'A02', txnDate: '2026-03-10', direction: 'IN', itemCode: 'I_PI', sourceItem: 'I_PI', amount: 2_000_000, memo: '연구책임자계정 대체' },
    { srcId: 'TXN-0103', accountId: 'A02', txnDate: '2026-03-25', direction: 'OUT', itemCode: 'O_PAY', sourceItem: 'I_PI', amount: 800_000, memo: '3월 학생인건비 지급' },
  ]);

  await db.insert(s.srcAccountSummary).values([
    { accountId: 'A01', baseDate: '2026-06-30', sourceItem: 'I_CARRY', inTotal: 5_000_000, outTotal: 0, balance: 5_000_000 },
    { accountId: 'A01', baseDate: '2026-06-30', sourceItem: 'I_GOV', inTotal: 30_000_000, outTotal: 12_000_000, balance: 18_000_000 },
    { accountId: 'A01', baseDate: '2026-06-30', sourceItem: 'I_UNIV', inTotal: 10_000_000, outTotal: 0, balance: 10_000_000 },
    { accountId: 'A01', baseDate: '2026-06-30', sourceItem: 'I_INT', inTotal: 120_000, outTotal: 0, balance: 120_000 },
    { accountId: 'A02', baseDate: '2026-06-30', sourceItem: 'I_CARRY', inTotal: 1_000_000, outTotal: 0, balance: 1_000_000 },
    { accountId: 'A02', baseDate: '2026-06-30', sourceItem: 'I_PI', inTotal: 2_000_000, outTotal: 800_000, balance: 1_200_000 },
  ]);
}

/** 모든 테이블을 비우고 시드 데이터를 넣는다. 통합 테스트에서도 호출한다. */
export async function seedAll() {
  // 데이터를 삭제하기 전에 DB 연결 대상 검사
  assertLocalDatabase();

  await clearAll();
  await seedRules();
  await seedAcademic();
  await seedPayments();
  await seedAccounts();
}

// `npm run db:seed` 로 직접 실행했을 때만 동작한다 (테스트에서 import 할 때는 실행되지 않음).
if (process.argv[1]?.endsWith('seed.ts')) {
  seedAll()
    .then(() => console.log('시드 완료'))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
