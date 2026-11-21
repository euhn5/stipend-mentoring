
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";

import { db } from "@/db/client";
import { seedAll } from "@/db/seed";
import { seedAuth } from "@/db/seed-auth";
import { appUser, professor } from "@/db/schema";

describe("개발용 로그인 계정 생성", () => {
  beforeEach(async () => {
    // 운영 DB나 개발용 local.db에서 테스트가 실행되지 않도록 확인
    expect(process.env.DATABASE_URL).toBe("file:test.db");

    // 매 테스트마다 테스트 DB를 초기 상태로 만듦
    await seedAll();
  });

  it("교수 데이터가 없어도 관리자 계정을 생성한다", async () => {
    // 처음 설치한 상태: 교수 데이터가 없음
    const professorsBefore = await db.select().from(professor);
    expect(professorsBefore).toHaveLength(0);

    await seedAuth();

    const users = await db.select().from(appUser);

    expect(users).toHaveLength(1);
    expect(users[0].userId).toBe("admin");
    expect(users[0].role).toBe("ADMIN");
    expect(users[0].profId).toBeNull();

    // 개발용 비밀번호가 평문이 아닌 해시로 저장되는지 확인
    expect(users[0].passwordHash).not.toBe("pass1234");
    expect(await compare("pass1234", users[0].passwordHash)).toBe(true);
  });

  it("교수 데이터가 생기면 교수 계정도 생성한다", async () => {
    // 첫 번째 실행: 관리자만 생성
    await seedAuth();

    // JOB-ACAD 실행 후 교수 데이터가 생긴 상황을 재현
    await db.insert(professor).values([
      {
        profId: "P01",
        name: "김교수",
        researcherNo: "10000001",
        dept: "컴퓨터공학과",
      },
      {
        profId: "P02",
        name: "이교수",
        researcherNo: "10000002",
        dept: "전자전기공학과",
      },
    ]);

    // 두 번째 실행: 교수 계정 추가
    await seedAuth();

    const users = await db.select().from(appUser);

    expect(users).toHaveLength(3);

    const admin = users.find((user) => user.userId === "admin");
    const p01 = users.find((user) => user.userId === "p01");
    const p02 = users.find((user) => user.userId === "p02");

    expect(admin?.role).toBe("ADMIN");
    expect(p01?.role).toBe("PROF");
    expect(p01?.profId).toBe("P01");
    expect(p02?.role).toBe("PROF");
    expect(p02?.profId).toBe("P02");
  });

  it("다시 실행해도 기존 계정과 비밀번호가 유지된다", async () => {
    await seedAuth();

    const [before] = await db
      .select()
      .from(appUser)
      .where(eq(appUser.userId, "admin"));

    expect(before).toBeDefined();

    // 같은 작업 다시 실행
    await seedAuth();

    const [after] = await db
      .select()
      .from(appUser)
      .where(eq(appUser.userId, "admin"));

    const users = await db.select().from(appUser);

    expect(users).toHaveLength(1);
    expect(after.passwordHash).toBe(before.passwordHash);
  });
});
