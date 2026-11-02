
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { loginAction } from "./actions";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: Props) {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <div
      style={{
        maxWidth: 440,
        margin: "60px auto",
        padding: 32,
        background: "#1e293b",
        color: "#f8fafc",
        borderRadius: 14,
        border: "1px solid #475569",
      }}
    >
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        연구생활장려금 로그인
      </h1>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: 28,
        }}
      >
        관리자 또는 지도교수 계정으로 로그인하세요.
      </p>

      {error === "1" && (
        <p
          role="alert"
          style={{
            padding: 12,
            marginBottom: 20,
            background: "#450a0a",
            color: "#fca5a5",
            borderRadius: 8,
          }}
        >
          아이디 또는 비밀번호를 확인해 주세요.
        </p>
      )}

      <form action={loginAction}>
        <label
          htmlFor="userId"
          style={{
            display: "block",
            marginBottom: 8,
          }}
        >
          아이디
        </label>

        <input
          id="userId"
          name="userId"
          type="text"
          autoComplete="username"
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 22,
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #475569",
            borderRadius: 8,
          }}
        />

        <label
          htmlFor="password"
          style={{
            display: "block",
            marginBottom: 8,
          }}
        >
          비밀번호
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 26,
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #475569",
            borderRadius: 8,
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: 14,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          로그인
        </button>
      </form>
    </div>
  );
}
