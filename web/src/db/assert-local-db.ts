
import "dotenv/config";

// 파괴적인 DB 초기화 명령 실행 전 연결 대상 검사
const url = process.env.DATABASE_URL ?? "";

// 로컬 SQLite 파일만 초기화 허용
if (!url.startsWith("file:")) {
  console.error(
    "DB 초기화 중단: 로컬 SQLite 데이터베이스에서만 실행할 수 있습니다."
  );
  process.exit(1);
}

console.log("로컬 SQLite 데이터베이스 확인 완료");
