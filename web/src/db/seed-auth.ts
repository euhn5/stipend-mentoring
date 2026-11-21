
import "dotenv/config";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

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

// 이미 존재하는 계정은 수정하지 않음
async function createUser(
  userId: string,
  role: "ADMIN" | "PROF",
  profId: string | null,
  passwordHash: string
) {
  const [existing] = await db
    .select()
    .from(appUser)
    .where(eq(appUser.userId, userId))
    .limit(1);

  if (existing) {
    console.log(`${userId}: 이미 존재하여 건너뜀`);
    return;
  }

  await db.insert(appUser).values({
    userId,
    role,
    profId,
    passwordHash,
  });

  console.log(`${userId}: 생성 완료`);
}

// 테스트에서도 호출할 수 있도록 함수 내보내기
export async function seedAuth() {
  assertLocalDatabase();

  // 로컬 개발 전용 비밀번호
  const passwordHash = await hash("pass1234", 12);

  // 1. 교수 데이터가 없어도 관리자 계정 생성
  await createUser("admin", "ADMIN", null, passwordHash);

  // 2. 교수 데이터가 존재하는 경우에만 교수 계정 생성
  const professors = [
    { userId: "p01", profId: "P01" },
    { userId: "p02", profId: "P02" },
  ];

  for (const user of professors) {
    const [prof] = await db
      .select()
      .from(professor)
      .where(eq(professor.profId, user.profId))
      .limit(1);

    if (!prof) {
      console.log(
        `${user.userId}: ${user.profId} 교수 데이터가 없어 생성 보류`
      );
      continue;
    }

    await createUser(
      user.userId,
      "PROF",
      user.profId,
      passwordHash
    );
  }

  console.log("로그인 계정 설정 완료");
}

// 터미널에서 직접 실행한 경우에만 계정 생성
const isDirectExecution =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  seedAuth().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
