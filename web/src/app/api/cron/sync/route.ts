
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  srcAcademicMonthly,
  srcPayment,
} from "@/db/schema";

import {
  previousYmKst,
  lastDayOf,
} from "@/domain/month";

import { runAcadJob } from "@/jobs/acad";
import { runPayJob } from "@/jobs/pay";
import { runAcctJob } from "@/jobs/acct";

// 매월 전월 데이터를 자동 연동
export async function GET(request: Request) {
  // 1. Cron 인증
  const secret = process.env.CRON_SECRET;

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // 2. 한국 시간 기준 전월 계산
    const ym = previousYmKst(new Date());

    // 3. 원천 데이터 준비 여부 확인
    const academicRows = await db
      .select({ srcId: srcAcademicMonthly.srcId })
      .from(srcAcademicMonthly)
      .where(eq(srcAcademicMonthly.baseYm, ym))
      .limit(1);

    const paymentRows = await db
      .select({ srcId: srcPayment.srcId })
      .from(srcPayment)
      .where(eq(srcPayment.baseYm, ym))
      .limit(1);

    if (
      academicRows.length === 0 ||
      paymentRows.length === 0
    ) {
      return Response.json(
        {
          status: "SKIPPED",
          ym,
          message: "전월 학적 또는 지급 원천 데이터가 준비되지 않았습니다.",
          academicReady: academicRows.length > 0,
          paymentReady: paymentRows.length > 0,
        },
        { status: 409 }
      );
    }

    // 4. 학적 연동
    const acad = await runAcadJob(ym, "SCHEDULE");

    if (acad.status !== "SUCCESS") {
      return Response.json(
        { ym, failedJob: "JOB-ACAD", acad },
        { status: 500 }
      );
    }

    // 5. 지급 연동
    const pay = await runPayJob(ym, "SCHEDULE");

    if (pay.status !== "SUCCESS") {
      return Response.json(
        { ym, failedJob: "JOB-PAY", acad, pay },
        { status: 500 }
      );
    }

    // 6. 기관계정 연동
    const acct = await runAcctJob(
      `${ym}-01`,
      lastDayOf(ym),
      "SCHEDULE"
    );

    if (acct.status !== "SUCCESS") {
      return Response.json(
        { ym, failedJob: "JOB-ACCT", acad, pay, acct },
        { status: 500 }
      );
    }

    // 7. 모든 작업 성공
    return Response.json({
      status: "SUCCESS",
      ym,
      acad,
      pay,
      acct,
    });
  } catch (error) {
    console.error("Cron 실행 오류:", error);

    return Response.json(
      {
        status: "FAILED",
        message: "자동 연동 중 서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
