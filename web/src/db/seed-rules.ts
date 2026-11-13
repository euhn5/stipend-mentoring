
import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "./client";
import { ruleConfig } from "./schema";

// 기존 seed.ts에 정의된 기본 규칙
const rules = [
  {
    key: "eligible.acad_status",
    value: "재학",
    description: "R1: 충족으로 인정하는 학적상태",
  },
  {
    key: "eligible.fulltime_yn",
    value: "Y",
    description: "R2: 충족으로 인정하는 전일제 값",
  },
  {
    key: "eligible.activity_types",
    value: "RND,LAB",
    description: "R3: 충족으로 인정하는 연구활동 유형 (쉼표 구분)",
  },
  {
    key: "max_months.석사",
    value: "24",
    description: "R4: 석사 최대지원개월",
  },
  {
    key: "max_months.박사",
    value: "48",
    description: "R4: 박사 최대지원개월",
  },
  {
    key: "max_months.석박통합",
    value: "72",
    description: "R4: 석박통합 최대지원개월",
  },
  {
    key: "standard_amount.석사",
    value: "800000",
    description: "석사 월 기준금액(원)",
  },
  {
    key: "standard_amount.박사",
    value: "1100000",
    description: "박사 월 기준금액(원)",
  },
  {
    key: "standard_amount.석박통합.early",
    value: "800000",
    description: "석박통합 박사단계 전 월 기준금액(원)",
  },
  {
    key: "standard_amount.석박통합.late",
    value: "1100000",
    description: "석박통합 박사단계 월 기준금액(원)",
  },
  {
    key: "integrated.late_from_semester",
    value: "5",
    description: "석박통합에서 박사 기준금액을 적용하기 시작하는 학기차",
  },
];

async function seedRules() {
  // 연결 대상 확인
  const url = process.env.DATABASE_URL ?? "";

  if (!url.startsWith("libsql://")) {
    throw new Error(
      "이 초기화 도구는 원격 Turso DB에서만 실행할 수 있습니다."
    );
  }

  const host = new URL(url).hostname;
  console.log("연결 대상:", host);

  if (!process.env.DATABASE_AUTH_TOKEN) {
    throw new Error("DATABASE_AUTH_TOKEN이 필요합니다.");
  }

  let inserted = 0;
  let skipped = 0;

  for (const rule of rules) {
    const [existing] = await db
      .select({ key: ruleConfig.key })
      .from(ruleConfig)
      .where(eq(ruleConfig.key, rule.key))
      .limit(1);

    // 이미 존재하는 규칙은 변경하지 않음
    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(ruleConfig).values(rule);
    inserted++;
  }

  console.log(`규칙 추가: ${inserted}개`);
  console.log(`기존 규칙 유지: ${skipped}개`);
  console.log("규칙 설정 완료");
}

seedRules().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
