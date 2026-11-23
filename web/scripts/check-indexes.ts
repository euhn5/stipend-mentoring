import { db } from "../src/db/client";
import { sql } from "drizzle-orm";

async function main() {
  if (
    process.env.DATABASE_URL !== "file:benchmark.db" ||
    process.env.DATABASE_AUTH_TOKEN
  ) {
    throw new Error(
      "benchmark.db에서만 실행할 수 있습니다."
    );
  }

  const indexes = await db.all(
    sql`SELECT name, tbl_name
        FROM sqlite_master
        WHERE type = 'index'
        ORDER BY tbl_name, name`
  );

  console.table(indexes);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});