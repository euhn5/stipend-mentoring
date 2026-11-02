
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
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/authorization", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
    transaction: mocks.transaction,
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { saveRuleConfig } from "./actions";

function makeFormData() {
  const formData = new FormData();
  formData.set("key", "eligible.fulltime_yn");
  formData.set("value", "Y");
  return formData;
}

describe("기준정보 수정 서버 액션 권한 검사", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("미로그인 사용자는 수정할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      saveRuleConfig(makeFormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("교수 계정은 수정할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      saveRuleConfig(makeFormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
