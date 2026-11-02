
import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";

export const SESSION_COOKIE = "stipend_session";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type Session = {
  userId: string;
  role: "ADMIN" | "PROF";
  profId: string | null;
};

type SessionPayload = Session & {
  expiresAt: number;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET을 32자 이상으로 설정해 주세요."
    );
  }

  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

// 로그인 정보를 서명된 문자열로 변환
export function createSessionToken(
  session: Session
): string {
  const payload: SessionPayload = {
    ...session,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const encoded = Buffer.from(
    JSON.stringify(payload),
    "utf8"
  ).toString("base64url");

  return `${encoded}.${sign(encoded)}`;
}

// 쿠키의 서명과 만료 시간을 검증
export function verifySessionToken(
  token: string | undefined
): Session | null {
  if (!token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encoded, signature] = parts;

  if (!encoded || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );

    if (
      !payload ||
      typeof payload !== "object"
    ) {
      return null;
    }

    const data = payload as Record<string, unknown>;

    if (
      typeof data.userId !== "string" ||
      !data.userId ||
      (data.role !== "ADMIN" && data.role !== "PROF") ||
      (typeof data.profId !== "string" &&
        data.profId !== null) ||
      typeof data.expiresAt !== "number" ||
      !Number.isFinite(data.expiresAt) ||
      data.expiresAt <= Date.now()
    ) {
      return null;
    }

    if (data.role === "PROF" && !data.profId) {
      return null;
    }

    return {
      userId: data.userId,
      role: data.role,
      profId: data.profId,
    } as Session;
  } catch {
    return null;
  }
}

// 현재 요청의 로그인 정보 조회
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return verifySessionToken(token);
}

// 로그인 성공 시 쿠키 저장
export async function setSession(
  session: Session
): Promise<void> {
  const token = createSessionToken(session);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

// 로그아웃 시 쿠키 삭제
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}
