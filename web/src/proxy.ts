
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/session";

// 관리자 전용 페이지
const ADMIN_ONLY_PATHS = [
  "/sync",
  "/mock-source",
  "/settings",
  "/audit",
  "/checks",
  "/accounts",
  "/payments/plan",
  "/notifications",
  "/semester",
];

function matchesPath(
  pathname: string,
  target: string
): boolean {
  return (
    pathname === target ||
    pathname.startsWith(`${target}/`)
  );
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 로그인 화면과 Cron API 제외
  if (
    pathname === "/login" ||
    matchesPath(pathname, "/api/cron/sync")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(
    SESSION_COOKIE
  )?.value;

  const session = verifySessionToken(token);

  // 로그인하지 않은 사용자
  if (!session) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // 지도교수의 관리자 전용 페이지 접근 차단
  if (
    session.role === "PROF" &&
    ADMIN_ONLY_PATHS.some((path) =>
      matchesPath(pathname, path)
    )
  ) {
    return new NextResponse(
      "접근 권한이 없습니다.",
      {
        status: 403,
        headers: {
          "Content-Type":
            "text/plain; charset=utf-8",
        },
      }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
