
"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { notification } from "@/db/schema";
import { requireAdmin } from "@/lib/authorization";


export async function readNotification(formData: FormData) {
  // 알림 처리 전에 관리자 권한 확인
  await requireAdmin();

  const notiId = Number(formData.get("notiId"));


  if (!Number.isSafeInteger(notiId) || notiId <= 0) {
    throw new Error("올바르지 않은 알림 ID입니다.");
  }

  const rows = await db
    .select()
    .from(notification)
    .where(eq(notification.notiId, notiId))
    .limit(1);

  const noti = rows[0];

  if (!noti) {
    redirect("/notifications");
  }

  if (noti.readYn !== "Y") {
    await db
      .update(notification)
      .set({ readYn: "Y" })
      .where(eq(notification.notiId, notiId));
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");

  // 외부 주소로의 이동은 허용하지 않음
  const link =
    noti.link?.startsWith("/") &&
    !noti.link.startsWith("//") &&
    !noti.link.includes("\\") &&
    !/[\u0000-\u001f]/.test(noti.link)
      ? noti.link
      : "/notifications";

  redirect(link);
}
