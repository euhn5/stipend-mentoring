// 이공계 연구생활장려금 관리시스템 — DB 스키마 (Drizzle ORM, SQLite)
//
// 타입 규칙
// - 기준월: TEXT 'YYYY-MM' / 날짜: TEXT 'YYYY-MM-DD' / 시각: TEXT ISO 8601
// - 금액: INTEGER (원)
// - O/X, Y/N 값: TEXT 한 글자
//
// src_ 로 시작하는 테이블은 Mock 원천 시스템이다.
// 연동 오류를 재현해야 하므로 NOT NULL·FK 제약을 일부러 두지 않는다.

import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';

// ─────────────────────────────────────────────
// Mock 원천: 학적 시스템
// ─────────────────────────────────────────────

export const srcProfessor = sqliteTable('src_professor', {
  profId: text('prof_id').primaryKey(),
  name: text('name'),
  researcherNo: text('researcher_no'),
  dept: text('dept'),
});

export const srcAcademicMonthly = sqliteTable('src_academic_monthly', {
  srcId: text('src_id').primaryKey(),
  baseYm: text('base_ym'),
  studentNo: text('student_no'),
  name: text('name'),
  degree: text('degree'), // 석사 | 박사 | 석박통합
  researcherNo: text('researcher_no'),
  originUniv: text('origin_univ'),
  dept: text('dept'),
  acadStatus: text('acad_status'), // 재학 | 휴학 | 수료 | 졸업 | 제적
  semesterNo: integer('semester_no'),
  advisorId: text('advisor_id'),
  fulltimeYn: text('fulltime_yn'), // Y | N
  activityType: text('activity_type'), // RND | LAB | NONE
  updatedAt: text('updated_at'),
});

export const srcResearchHistory = sqliteTable('src_research_history', {
  srcId: text('src_id').primaryKey(),
  studentNo: text('student_no'),
  ym: text('ym'),
  activityType: text('activity_type'), // RND | LAB | NONE
});

// ─────────────────────────────────────────────
// Mock 원천: 재원별 지급 시스템
// ─────────────────────────────────────────────

export const srcPayment = sqliteTable('src_payment', {
  srcId: text('src_id').primaryKey(),
  systemCode: text('system_code'), // 지급 시스템 구분 (예: UNIV, RND, BK21)
  baseYm: text('base_ym'),
  studentNo: text('student_no'),
  fundCode: text('fund_code'),
  amount: integer('amount'),
  paidDate: text('paid_date'),
  updatedAt: text('updated_at'),
});

// ─────────────────────────────────────────────
// Mock 원천: 기관계정 회계 시스템
// ─────────────────────────────────────────────

export const srcAccountTxn = sqliteTable('src_account_txn', {
  srcId: text('src_id').primaryKey(),
  accountId: text('account_id'),
  txnDate: text('txn_date'),
  direction: text('direction'), // IN | OUT
  itemCode: text('item_code'),
  sourceItem: text('source_item'),
  amount: integer('amount'),
  memo: text('memo'),
});

// 회계팀이 보고한 출처(수입항목)별 집계값. base_date 시점까지의 누적값이다.
export const srcAccountSummary = sqliteTable(
  'src_account_summary',
  {
    accountId: text('account_id').notNull(),
    baseDate: text('base_date').notNull(),
    sourceItem: text('source_item').notNull(),
    inTotal: integer('in_total'),
    outTotal: integer('out_total'),
    balance: integer('balance'),
  },
  (t) => [primaryKey({ columns: [t.accountId, t.baseDate, t.sourceItem] })],
);

// ─────────────────────────────────────────────
// 본 시스템: 학생연구자 명부
// ─────────────────────────────────────────────

export const professor = sqliteTable('professor', {
  profId: text('prof_id').primaryKey(),
  name: text('name').notNull(),
  researcherNo: text('researcher_no').notNull(),
  dept: text('dept').notNull(),
});

export const studentMonthly = sqliteTable(
  'student_monthly',
  {
    baseYm: text('base_ym').notNull(),
    studentNo: text('student_no').notNull(),
    name: text('name').notNull(),
    degree: text('degree').notNull(),
    researcherNo: text('researcher_no').notNull(),
    originUniv: text('origin_univ').notNull(),
    dept: text('dept').notNull(),
    acadStatus: text('acad_status').notNull(),
    semesterNo: integer('semester_no').notNull(),
    advisorId: text('advisor_id')
      .notNull()
      .references(() => professor.profId),
    fulltimeYn: text('fulltime_yn').notNull(),
    activityType: text('activity_type').notNull(),
    cumSupportMonths: integer('cum_support_months').notNull(),
    syncedAt: text('synced_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.baseYm, t.studentNo] }), index('idx_student_monthly_advisor').on(t.advisorId)],
);

export const eligibilityResult = sqliteTable(
  'eligibility_result',
  {
    baseYm: text('base_ym').notNull(),
    studentNo: text('student_no').notNull(),
    r1Status: text('r1_status').notNull(), // O | X
    r2Fulltime: text('r2_fulltime').notNull(),
    r3Activity: text('r3_activity').notNull(),
    r4Period: text('r4_period').notNull(),
    maxSupportYm: text('max_support_ym'), // R4 = X 이면 NULL
    overall: text('overall').notNull(),
    standardAmount: integer('standard_amount'), // overall = X 이면 NULL
    judgedAt: text('judged_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.baseYm, t.studentNo] })],
);

// ─────────────────────────────────────────────
// 본 시스템: 학생지원금 지급내역
// ─────────────────────────────────────────────

export const payment = sqliteTable(
  'payment',
  {
    paymentId: integer('payment_id').primaryKey({ autoIncrement: true }),
    baseYm: text('base_ym').notNull(),
    studentNo: text('student_no').notNull(),
    fundCode: text('fund_code').notNull(),
    amount: integer('amount').notNull(),
    paidDate: text('paid_date').notNull(),
    srcRefId: text('src_ref_id').notNull().unique(),
  },
  (t) => [index('idx_payment_ym_student').on(t.baseYm, t.studentNo)],
);

export const paymentPlan = sqliteTable(
  'payment_plan',
  {
    baseYm: text('base_ym').notNull(),
    studentNo: text('student_no').notNull(),
    fundCode: text('fund_code').notNull(),
    plannedAmount: integer('planned_amount').notNull(),
  },
  (t) => [primaryKey({ columns: [t.baseYm, t.studentNo, t.fundCode] })],
);

// ─────────────────────────────────────────────
// 본 시스템: 기관계정
// ─────────────────────────────────────────────

export const account = sqliteTable('account', {
  accountId: text('account_id').primaryKey(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type').notNull(), // UNIV | SUB
});

export const accountLedger = sqliteTable(
  'account_ledger',
  {
    txnId: integer('txn_id').primaryKey({ autoIncrement: true }),
    accountId: text('account_id')
      .notNull()
      .references(() => account.accountId),
    txnDate: text('txn_date').notNull(),
    direction: text('direction').notNull(), // IN | OUT
    itemCode: text('item_code').notNull(),
    sourceItem: text('source_item').notNull(),
    amount: integer('amount').notNull(),
    memo: text('memo'),
    srcRefId: text('src_ref_id').notNull().unique(),
  },
  (t) => [index('idx_ledger_account_date').on(t.accountId, t.txnDate)],
);

// ─────────────────────────────────────────────
// 공통
// ─────────────────────────────────────────────

export const ruleConfig = sqliteTable('rule_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  description: text('description').notNull(),
});

export const auditLog = sqliteTable(
  'audit_log',
  {
    logId: integer('log_id').primaryKey({ autoIncrement: true }),
    tableName: text('table_name').notNull(),
    rowKey: text('row_key').notNull(), // 예: '2026-03|2025110002'
    action: text('action').notNull(), // C | U | D
    beforeJson: text('before_json'), // C 이면 NULL
    afterJson: text('after_json'), // D 이면 NULL
    actor: text('actor').notNull(), // 'admin' 또는 'SYSTEM:JOB-ACAD' 등
    actedAt: text('acted_at').notNull(),
  },
  (t) => [index('idx_audit_table_key').on(t.tableName, t.rowKey)],
);

export const syncLog = sqliteTable('sync_log', {
  syncId: integer('sync_id').primaryKey({ autoIncrement: true }),
  jobCode: text('job_code').notNull(), // JOB-ACAD | JOB-PAY | JOB-ACCT
  target: text('target').notNull(), // 기준월 '2026-03' 또는 기간 '2026-01-01~2026-06-30'
  status: text('status').notNull(), // RUNNING | SUCCESS | PARTIAL | FAILED
  readCnt: integer('read_cnt').notNull().default(0),
  okCnt: integer('ok_cnt').notNull().default(0),
  errCnt: integer('err_cnt').notNull().default(0),
  trigger: text('trigger').notNull(), // MANUAL | SCHEDULE
  message: text('message'), // FAILED 일 때 예외 메시지
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
});

export const syncError = sqliteTable('sync_error', {
  errId: integer('err_id').primaryKey({ autoIncrement: true }),
  syncId: integer('sync_id')
    .notNull()
    .references(() => syncLog.syncId),
  srcTable: text('src_table').notNull(),
  srcRefId: text('src_ref_id').notNull(),
  errorCode: text('error_code').notNull(), // E_REQUIRED | E_CODE | E_REF | E_VALUE
  message: text('message').notNull(),
});

export const notification = sqliteTable('notification', {
  notiId: integer('noti_id').primaryKey({ autoIncrement: true }),
  receiver: text('receiver').notNull(), // 'ADMIN' 또는 교수 ID
  type: text('type').notNull(), // ACAD_STATUS_CHANGED | REQ_DETAIL_CHANGED | ELIGIBILITY_CHANGED | SYNC_ALERT
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  readYn: text('read_yn').notNull().default('N'),
  createdAt: text('created_at').notNull(),
});

// P2: 로그인
export const appUser = sqliteTable('app_user', {
  userId: text('user_id').primaryKey(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // ADMIN | PROF
  profId: text('prof_id').references(() => professor.profId),
});
