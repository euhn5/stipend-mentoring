
import { previousYmKst, lastDayOf } from "@/domain/month";
import { runAcadJob } from "@/jobs/acad";
import { runPayJob } from "@/jobs/pay";
import { runAcctJob } from "@/jobs/acct";

/**
 * 자동 연동 API
 * 매월 전월 데이터를 대상으로 세 개의 Job 실행
 */
export async function GET(request: Request) {
  // 1. 인증 확인
  const secret = process.env.CRON_SECRET;

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. 한국 시간 기준 전월 계산
  const ym = previousYmKst(new Date());

  // 3. 학적 → 지급 → 기관계정 순서로 연동
  const acad = await runAcadJob(ym, "SCHEDULE");

  const pay = await runPayJob(ym, "SCHEDULE");

  const acct = await runAcctJob(
    `${ym}-01`,
    lastDayOf(ym),
    "SCHEDULE"
  );

  // 4. 실행 결과 반환
  return Response.json({
    ym,
    acad,
    pay,
    acct,
  });
}
