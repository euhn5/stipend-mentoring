
"use server";

import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { appUser } from "@/db/schema";
import { setSession } from "@/lib/session";

export async function loginAction(
  formData: FormData
): Promise<void> {
  const userId = String(
    formData.get("userId") ?? ""
  ).trim();

  const password = String(
    formData.get("password") ?? ""
  );

  if (!userId || !password) {
    redirect("/login?error=1");
  }

  const [user] = await db
    .select()
    .from(appUser)
    .where(eq(appUser.userId, userId))
    .limit(1);

  if (!user) {
    redirect("/login?error=1");
  }

  const passwordMatches = await compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    redirect("/login?error=1");
  }

  if (
    user.role !== "ADMIN" &&
    user.role !== "PROF"
  ) {
    redirect("/login?error=1");
  }

  if (user.role === "PROF" && !user.profId) {
    redirect("/login?error=1");
  }

  await setSession({
    userId: user.userId,
    role: user.role,
    profId: user.profId,
  });

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const { clearSession } = await import("@/lib/session");

  await clearSession();

  redirect("/login");
}

