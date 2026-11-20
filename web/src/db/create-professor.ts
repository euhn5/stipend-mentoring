
import "dotenv/config";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import * as readline from "node:readline";
import { createInterface } from "node:readline/promises";

import { db } from "./client";
import { appUser, professor } from "./schema";

const EXPECTED_HOST =
  "stipend-mentoring-euhn5.aws-ap-northeast-1.turso.io";

const ACCOUNTS = {
  p01: "P01",
  p02: "P02",
} as const;

type ProfessorUserId = keyof typeof ACCOUNTS;

// 터미널에 비밀번호를 표시하지 않고 입력받기
function readHidden(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      reject(new Error("대화형 터미널에서 실행해 주세요."));
      return;
    }

    let value = "";
    const wasRaw = process.stdin.isRaw;

    process.stdout.write(prompt);
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();

    function cleanup() {
      process.stdin.removeListener("keypress", onKeypress);
      process.stdin.setRawMode(Boolean(wasRaw));
      process.stdin.pause();
      process.stdout.write("\n");
    }

    function onKeypress(
      char: string | undefined,
      key: readline.Key | undefined
    ) {
      if (key?.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("사용자가 입력을 취소했습니다."));
        return;
      }

      if (key?.name === "return" || key?.name === "enter") {
        cleanup();
        resolve(value);
        return;
      }

      if (key?.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }

      if (key?.ctrl || key?.meta || !char) {
        return;
      }

      if (char >= " " && char !== "\u007f") {
        value += char;
      }
    }

    process.stdin.on("keypress", onKeypress);
  });
}

async function createProfessor() {
  // 1. DB 연결 대상 검사
  const url = process.env.DATABASE_URL ?? "";
  const token = process.env.DATABASE_AUTH_TOKEN ?? "";

  if (!url.startsWith("libsql://")) {
    throw new Error("원격 Turso DB에서만 실행할 수 있습니다.");
  }

  const host = new URL(url).hostname;

  if (host !== EXPECTED_HOST) {
    throw new Error(`허용되지 않은 DB: ${host}`);
  }

  if (!token) {
    throw new Error("DATABASE_AUTH_TOKEN이 필요합니다.");
  }

  console.log("연결 대상 DB:", host);
  console.log("기존 계정과 데이터는 변경하지 않습니다.");

  // 2. 생성할 교수 계정 선택
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let userId: string;
  let confirmation: string;

  try {
    userId = (
      await rl.question("생성할 교수 계정 (p01 또는 p02): ")
    ).trim().toLowerCase();

    if (!(userId in ACCOUNTS)) {
      throw new Error("p01 또는 p02만 입력할 수 있습니다.");
    }

    const profId = ACCOUNTS[userId as ProfessorUserId];

    console.log(`로그인 ID: ${userId}`);
    console.log(`연결 교수 ID: ${profId}`);

    confirmation = await rl.question(
      "계정을 생성하려면 CREATE PROFESSOR를 입력하세요: "
    );
  } finally {
    rl.close();
  }

  if (confirmation !== "CREATE PROFESSOR") {
    throw new Error("교수 계정 생성이 취소되었습니다.");
  }

  const profId = ACCOUNTS[userId as ProfessorUserId];

  // 3. 교수 정보 존재 여부 확인
  const [existingProfessor] = await db
    .select({ profId: professor.profId })
    .from(professor)
    .where(eq(professor.profId, profId))
    .limit(1);

  if (!existingProfessor) {
    throw new Error(
      `${profId} 교수 정보가 존재하지 않습니다.`
    );
  }

  // 4. 기존 로그인 계정 확인
  const [existingUser] = await db
    .select({ userId: appUser.userId })
    .from(appUser)
    .where(eq(appUser.userId, userId))
    .limit(1);

  if (existingUser) {
    throw new Error(
      `${userId} 계정이 이미 존재합니다. 기존 계정은 변경하지 않습니다.`
    );
  }

  // 5. 새 비밀번호 입력
  const password = await readHidden("새 교수 비밀번호: ");
  const confirmationPassword = await readHidden(
    "비밀번호 다시 입력: "
  );

  if (
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 72 ||
    password === "pass1234"
  ) {
    throw new Error(
      "비밀번호는 12자 이상, UTF-8 기준 72바이트 이하로 설정해 주세요."
    );
  }

  if (password !== confirmationPassword) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }

  // 6. 비밀번호 암호화 후 계정 생성
  const passwordHash = await hash(password, 12);

  await db.insert(appUser).values({
    userId,
    passwordHash,
    role: "PROF",
    profId,
  });

  console.log(`${userId} 교수 계정 생성 완료`);
  console.log("기존 관리자 계정과 데이터는 유지되었습니다.");
}

createProfessor().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "알 수 없는 오류"
  );
  process.exitCode = 1;
});
