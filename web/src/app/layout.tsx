
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
  description: "학생연구자 지원요건 판정 및 연구생활장려금 지급 관리 시스템",
};

const menus = [
  { name: "학생연구자 명부", href: "/roster?ym=2026-03" },
  { name: "지도교수별 현황", href: "/professors?ym=2026-03&view=roster" },
  { name: "지급내역", href: "/payments?ym=2026-03" },
  { name: "기관계정", href: "/accounts/A01?from=2026-01-01&to=2026-06-30" },
  { name: "연동관리", href: "/sync" },
  { name: "감사로그", href: "/audit" },
  { name: "Mock 원천", href: "/mock-source?table=src_payment" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 text-gray-900">
        <div className="flex min-h-screen">
          <aside className="w-64 shrink-0 bg-slate-900 p-6 text-white">
            <Link href="/" className="mb-10 block text-xl font-bold">
              연구생활장려금
            </Link>

            <nav className="space-y-2">
              {menus.map((menu) => (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className="block rounded-lg px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
                >
                  {menu.name}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
