
import { describe, it, expect } from "vitest";

import { assertAdmin } from "@/lib/authorization";
import type { Session } from "@/lib/session";

describe("관리자 권한 검사", () => {
  const admin: Session = {
    userId: "admin",
    role: "ADMIN",
    profId: null,
  };

  const professorP01: Session = {
    userId: "p01",
    role: "PROF",
    profId: "P01",
  };

  const professorP02: Session = {
    userId: "p02",
    role: "PROF",
    profId: "P02",
  };

  it("로그인하지 않은 사용자는 거부한다", () => {
    expect(() => assertAdmin(null)).toThrow(
      "관리자 권한이 필요합니다."
    );
  });

  it("P01 교수 계정은 거부한다", () => {
    expect(() => assertAdmin(professorP01)).toThrow(
      "관리자 권한이 필요합니다."
    );
  });

  it("P02 교수 계정은 거부한다", () => {
    expect(() => assertAdmin(professorP02)).toThrow(
      "관리자 권한이 필요합니다."
    );
  });

  it("ADMIN 계정은 허용한다", () => {
    expect(() => assertAdmin(admin)).not.toThrow();
  });
});
