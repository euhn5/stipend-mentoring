
import "dotenv/config";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { db } from "./client";
import { appUser, professor } from "./schema";

// 개발용 계정은 로컬 SQLite에서만 생성
function assertLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";

  if (!url.startsWith("file:")) {
    throw new Error(
      "개발용 계정은 로컬 SQLite 데이터베이스에서만 생성할 수 있습니다."
    );
  }
}

async function seedAuth() {
  // 데이터베이스 조회 및 계정 생성 전에 연결 대상 확인
  assertLocalDatabase();
  // 기존 교수 데이터가 있는지 먼저 확인
  for (const profId of ["P01", "P02"]) {
    const [prof] = await db
      .select()
      .from(professor)
      .where(eq(professor.profId, profId))
      .limit(1);

    if (!prof) {
      throw new Error(
        `${profId} 교수가 없습니다. 먼저 JOB-ACAD를 실행하세요.`
      );
    }
  }

  // 개발용 초기 비밀번호를 해시로 변환
  const passwordHash = await hash("pass1234", 12);

  const users = [
    {
      userId: "admin",
      role: "ADMIN",
      profId: null,
    },
    {
      userId: "p01",
      role: "PROF",
      profId: "P01",
    },
    {
      userId: "p02",
      role: "PROF",
      profId: "P02",
    },
  ];

  for (const user of users) {
    const [existing] = await db
      .select()
      .from(appUser)
      .where(eq(appUser.userId, user.userId))
      .limit(1);

    if (existing) {
      console.log(`${user.userId}: 이미 존재하여 건너뜀`);
      continue;
    }

    await db.insert(appUser).values({
      ...user,
      passwordHash,
    });

    console.log(`${user.userId}: 생성 완료`);
  }

  console.log("로그인 계정 설정 완료");
}

seedAuth().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
