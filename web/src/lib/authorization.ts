
import {
  getSession,
  type Session,
} from "@/lib/session";

// 현재 사용자가 관리자인지 확인
export function assertAdmin(
  session: Session | null
): asserts session is Session {
  if (!session || session.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

// 서버 액션에서 사용하는 공통 관리자 권한 검사
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();

  assertAdmin(session);

  return session;
}
