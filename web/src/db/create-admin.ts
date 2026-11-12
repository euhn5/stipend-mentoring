
import "dotenv/config";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import * as readline from "node:readline";
import { createInterface } from "node:readline/promises";

import { db } from "./client";
import { appUser } from "./schema";

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

async function createAdmin() {
  const url = process.env.DATABASE_URL ?? "";
  const token = process.env.DATABASE_AUTH_TOKEN ?? "";

  // 로컬 DB나 주소가 없는 경우 실행 중단
  if (
    !(
      url.startsWith("libsql://") ||
      url.startsWith("https://")
    )
  ) {
    throw new Error(
      "운영용 관리자 생성은 원격 libSQL DB에서만 허용합니다."
    );
  }

  if (!token) {
    throw new Error(
      "DATABASE_AUTH_TOKEN이 설정되지 않았습니다."
    );
  }

  // URL의 호스트만 표시하고 인증 정보는 출력하지 않음
  const host = new URL(url).hostname;

  console.log(`연결 대상 DB: ${host}`);
  console.log("관리자 계정 ID: admin");
  console.log("기존 데이터는 초기화하지 않습니다.");

  const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

  let confirmation: string;

  try {
    confirmation = await rl.question(
      "DB를 확인했다면 CREATE ADMIN을 입력하세요: "
    );
  } finally {
    rl.close();
  }

  if (confirmation !== "CREATE ADMIN") {
    throw new Error("관리자 생성이 취소되었습니다.");
  }

  // 계정이 이미 있으면 비밀번호를 변경하지 않음
  const [existing] = await db
    .select({ userId: appUser.userId })
    .from(appUser)
    .where(eq(appUser.userId, "admin"))
    .limit(1);

  if (existing) {
    throw new Error(
      "admin 계정이 이미 존재합니다. 기존 계정은 변경하지 않습니다."
    );
  }

  const password = await readHidden("새 관리자 비밀번호: ");
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

  const passwordHash = await hash(password, 12);

  // 운영용 관리자 계정 생성
  await db.insert(appUser).values({
    userId: "admin",
    role: "ADMIN",
    profId: null,
    passwordHash,
  });

  console.log("운영용 관리자 계정 생성 완료");
}

createAdmin().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "알 수 없는 오류"
  );
  process.exitCode = 1;
});
