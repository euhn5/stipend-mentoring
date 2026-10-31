
"use server";

import { redirect } from "next/navigation";
import { runAcadJob } from "@/jobs/acad";

export async function runSyncAction(formData: FormData) {
  const jobCode = String(formData.get("jobCode") ?? "");
  const target = String(formData.get("target") ?? "");

  if (jobCode !== "JOB-ACAD") {
    throw new Error("현재는 JOB-ACAD만 실행할 수 있습니다.");
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(target)) {
    throw new Error("기준월을 YYYY-MM 형식으로 입력해 주세요.");
  }

  const { syncId } = await runAcadJob(target, "MANUAL");

  redirect(`/sync?syncId=${syncId}`);
}
