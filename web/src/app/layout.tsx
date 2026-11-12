import { logoutAction } from "@/app/login/actions";
import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { Geist, Geist_Mono } from "next/font/google";
import { count, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { notification } from "@/db/schema";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "이공계 연구생활장려금 관리시스템",
  description:
    "학생연구자 지원요건 판정 및 연구생활장려금 지급 관리 시스템",
};

const menus = [
  {
    name: "기준정보 관리",
    href: "/settings",
  },
  {
    name: "지급 계획 vs 실지급",
    href: "/payments/plan?ym=2026-03",
  },

  {
    name: "정합성 점검",
    href: "/checks?ym=2026-03&accountId=A01",
  },

  {
    name: "학기별 현황",
    href: "/semester?term=2026-1&view=roster",
  },
  {
    name: "학생연구자 명부",
    href: "/roster?ym=2026-03",
  },
  {
    name: "지도교수별 현황",
    href: "/professors?ym=2026-03&view=roster",
  },
  {
    name: "지급내역",
    href: "/payments?ym=2026-03",
  },
  {
    name: "기관계정",
    href: "/accounts/A01?from=2026-01-01&to=2026-06-30",
  },
  {
    name: "연동관리",
    href: "/sync",
  },
  {
    name: "감사로그",
    href: "/audit",
  },
  {
    name: "Mock 원천",
    href: "/mock-source?table=academic&ym=2026-03",
  },
];



export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  // 안 읽은 알림 개수 조회
  const [result] = await db
    .select({
      unreadCount: count(),
    })
    .from(notification)
    .where(eq(notification.readYn, "N"));

  const unreadCount = result?.unreadCount ?? 0;


  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 text-gray-900">
        <div className="flex min-h-screen">

          <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-slate-900 p-6 text-white">
            {/* 시스템 제목 */}
            <Link
              href="/"
              className="mb-6 block shrink-0 text-xl font-bold"
            >
              연구생활장려금
            </Link>

            {/* 메뉴만 스크롤 */}
            <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto">

              {menus
                .filter((menu) => {
                  const path = menu.href.split("?")[0];

                  // 운영 환경에서는 Mock 원천 메뉴 숨기기
                  if (
                    path === "/mock-source" &&
                    process.env.NODE_ENV === "production"
                  ) {
                    return false;
                  }

                  // 관리자는 나머지 모든 메뉴 접근 가능
                  if (isAdmin) return true;

                  // 교수 계정은 지정된 메뉴만 표시
                  return [
                    "/roster",
                    "/professors",
                    "/payments",
                  ].includes(path);
                })
                .map((menu) => (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className="block rounded-lg px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                  >
                    {menu.name}
                  </Link>
                ))}


              {/* 알림함 메뉴: 관리자에게만 표시 */}
              {isAdmin && (
                <Link
                  href="/notifications"
                  className="flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  <span>알림함</span>

                  {unreadCount > 0 && (
                    <span
                      className="inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white"
                      aria-label={`안 읽은 알림 ${unreadCount}건`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}


            </nav>

            {/* 하단 고정 로그아웃 버튼 */}
            <form action={logoutAction} className="mt-4 shrink-0">
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-600 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
              >
                로그아웃
              </button>
            </form>
          </aside>


          {/* 페이지 본문 */}
          <main className="min-w-0 flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html >
  );
}
