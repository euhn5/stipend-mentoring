
"use client";

import { usePathname, useRouter } from "next/navigation";

export default function AccountSwitcher() {
  const pathname = usePathname();
  const router = useRouter();

  const accountId = pathname.split("/")[2] ?? "A01";

  return (
    <div
      style={{
        padding: 20,
        border: "1px solid #475569",
        borderRadius: 10,
        marginBottom: 24,
      }}
    >
      <label
        htmlFor="account-select"
        style={{
          display: "block",
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        기관계정 선택
      </label>

      <select
        id="account-select"
        value={accountId}
        onChange={(event) => {
          const selectedId = event.target.value;

          // 기존 조회 기간 등 URL 검색 조건 유지
          router.push(
            `/accounts/${selectedId}${window.location.search}`
          );
        }}
        style={{
          padding: 12,
          borderRadius: 8,
          border: "1px solid #475569",
          background: "#0f172a",
          color: "#f8fafc",
          minWidth: 280,
        }}
      >
        <option value="A01">
          A01 · 대학계정
        </option>
        <option value="A02">
          A02 · 기관 세부계정
        </option>
      </select>
    </div>
  );
}
