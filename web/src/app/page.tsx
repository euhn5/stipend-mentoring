
import Link from "next/link";

const pages = [
  { title: "학생연구자 명부", href: "/roster?ym=2026-03" },
  { title: "지도교수별 현황", href: "/professors?ym=2026-03&view=roster" },
  { title: "지급내역", href: "/payments?ym=2026-03" },
  { title: "기관계정", href: "/accounts/A01?from=2026-01-01&to=2026-06-30" },
  { title: "연동관리", href: "/sync" },
  { title: "감사로그", href: "/audit" },
  { title: "Mock 원천", href: "/mock-source?table=src_payment" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">
          연구생활장려금 관리시스템
        </h1>
        <p className="mt-3 text-gray-600">
          학생연구자 지원요건과 연구생활장려금 지급 정보를 관리합니다.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">
              {page.title}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              해당 관리 화면으로 이동하기
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
