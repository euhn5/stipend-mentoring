
import { existsSync, copyFileSync, readFileSync } from "node:fs";

const envPath = ".env.test";
const examplePath = ".env.test.example";

if (!existsSync(envPath)) {
  if (!existsSync(examplePath)) {
    console.error("테스트 환경 예시 파일이 없습니다.");
    process.exit(1);
  }

  copyFileSync(examplePath, envPath);
  console.log(".env.test 파일을 생성했습니다.");
}

const content = readFileSync(envPath, "utf8");
const match = content.match(/^DATABASE_URL\s*=\s*(.+)\s*$/m);
const databaseUrl = match?.[1]?.trim().replace(/^["']|["']$/g, "");

if (databaseUrl !== "file:test.db") {
  console.error(
    "테스트 준비 중단: DATABASE_URL은 file:test.db여야 합니다."
  );
  process.exit(1);
}

console.log("테스트 DB 설정 확인 완료: file:test.db");
