
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

import { readNotification } from "./actions";

function makeFormData() {
  const formData = new FormData();
  formData.set("notiId", "1");
  return formData;
}

describe("알림 읽음 처리 서버 액션 권한 검사", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("미로그인 사용자는 알림을 변경할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      readNotification(makeFormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("교수 계정은 알림을 변경할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      readNotification(makeFormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
