
import { performance } from "node:perf_hooks";

import { getRoster, getRosterByStudentNo } from "../src/queries/roster";
import { getPayments, getPaymentByStudentNo } from "../src/queries/payments";

const YM = "2026-03";
const STUDENT_NO = "B0000001";

const MONTHS = [
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
];

const REPEAT = 3;

function assertBenchmarkDatabase() {
  if (
    process.env.DATABASE_URL !== "file:benchmark.db" ||
    process.env.DATABASE_AUTH_TOKEN
  ) {
    throw new Error(
      "성능 측정은 file:benchmark.db에서만 실행할 수 있습니다."
    );
  }
}

function average(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

async function measure<T>(
  label: string,
  fn: () => Promise<T>,
  getCount: (result: T) => number
) {
  // 첫 실행은 예열용이며 평균에서 제외한다.
  await fn();

  const times: number[] = [];
  let resultCount = 0;

  for (let i = 0; i < REPEAT; i++) {
    const start = performance.now();

    const result = await fn();

    const elapsed = performance.now() - start;

    times.push(elapsed);
    resultCount = getCount(result);
  }

  const avg = average(times);

  console.log(`\n[${label}]`);
  console.log(`조회 결과: ${resultCount}건`);
  console.log(
    `측정 시간: ${times.map((t) => t.toFixed(2)).join(", ")} ms`
  );
  console.log(`평균: ${avg.toFixed(2)} ms`);

  return avg;
}

async function main() {
  assertBenchmarkDatabase();

  console.log("==================================");
  console.log("학생 2,000명 규모 성능 측정");
  console.log("DB: benchmark.db");
  console.log("기준월:", YM);
  console.log("반복 측정:", REPEAT, "회");
  console.log("==================================");

  const rosterTime = await measure(
    "전체 학생 명부",
    () => getRoster({ ym: YM }),
    (rows) => rows.length
  );

  const paymentsTime = await measure(
    "전체 학생 지급내역",
    () => getPayments({ ym: YM }),
    (rows) => rows.length
  );

  const oneRosterTime = await measure(
    "학생 1명 명부",
    () => getRosterByStudentNo(YM, STUDENT_NO),
    (row) => (row === null ? 0 : 1)
  );

  const onePaymentTime = await measure(
    "학생 1명 지급내역",
    () => getPaymentByStudentNo(YM, STUDENT_NO),
    (row) => (row === null ? 0 : 1)
  );

  const sixMonthTime = await measure(
    "학생 1명 6개월 지급내역",
    () =>
      Promise.all(
        MONTHS.map((ym) =>
          getPaymentByStudentNo(ym, STUDENT_NO)
        )
      ),
    (rows) => rows.filter((row) => row !== null).length
  );

  console.log("\n==================================");
  console.log("최종 성능 측정 요약");
  console.log("==================================");

  console.table([
    {
      target: "전체 명부",
      averageMs: Number(rosterTime.toFixed(2)),
    },
    {
      target: "전체 지급내역",
      averageMs: Number(paymentsTime.toFixed(2)),
    },
    {
      target: "학생 1명 명부",
      averageMs: Number(oneRosterTime.toFixed(2)),
    },
    {
      target: "학생 1명 지급내역",
      averageMs: Number(onePaymentTime.toFixed(2)),
    },
    {
      target: "학생 1명 6개월 지급",
      averageMs: Number(sixMonthTime.toFixed(2)),
    },
  ]);
}

main().catch((error) => {
  console.error("성능 측정 실패:", error);
  process.exitCode = 1;
});
