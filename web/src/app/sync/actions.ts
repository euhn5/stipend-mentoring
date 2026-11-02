
"use server";
import { requireAdmin } from "@/lib/authorization";
import { redirect } from "next/navigation";
import { runAcadJob } from "@/jobs/acad";
import { runPayJob } from "@/jobs/pay";
import { runAcctJob } from "@/jobs/acct";



export async function runSyncAction(formData: FormData) {
  await requireAdmin();

  const jobCode = String(formData.get("jobCode") ?? "");



  let syncId: number;

  if (jobCode === "JOB-ACAD" || jobCode === "JOB-PAY") {
    const target = String(formData.get("target") ?? "");

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(target)) {
      throw new Error("기준월을 YYYY-MM 형식으로 입력해 주세요.");
    }

    const result =
      jobCode === "JOB-ACAD"
        ? await runAcadJob(target, "MANUAL")
        : await runPayJob(target, "MANUAL");

    syncId = result.syncId;
  } else if (jobCode === "JOB-ACCT") {
    const from = String(formData.get("from") ?? "");
    const to = String(formData.get("to") ?? "");

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
      from > to
    ) {
      throw new Error("올바른 시작일과 종료일을 입력해 주세요.");
    }

    const result = await runAcctJob(from, to, "MANUAL");
    syncId = result.syncId;
  } else {
    throw new Error("지원하지 않는 연동 작업입니다.");
  }

  redirect(`/sync?syncId=${syncId}`);
}
