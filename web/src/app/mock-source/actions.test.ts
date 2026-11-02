
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/authorization", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
    update: mocks.update,
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import {
  updateAcademicSource,
  updatePaymentSource,
} from "./actions";

describe("Mock 원천 수정 서버 액션 권한 검사", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("미로그인 사용자는 학적 원천을 수정할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      updateAcademicSource(new FormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("교수 계정은 학적 원천을 수정할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      updateAcademicSource(new FormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("미로그인 사용자는 지급 원천을 수정할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      updatePaymentSource(new FormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("교수 계정은 지급 원천을 수정할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      updatePaymentSource(new FormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
