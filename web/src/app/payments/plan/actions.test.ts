
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getRoster: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/authorization", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/db/client", () => ({
  db: {
    transaction: mocks.transaction,
  },
}));

vi.mock("@/queries/roster", () => ({
  getRoster: mocks.getRoster,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { savePaymentPlan } from "./actions";

function makeFormData() {
  const formData = new FormData();
  formData.set("ym", "2026-03");
  formData.set("studentNo", "2023210001");
  formData.set("fundCode", "F01");
  formData.set("plannedAmount", "1000000");
  return formData;
}

describe("지급 계획 수정 서버 액션 권한 검사", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("미로그인 사용자는 지급 계획을 수정할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      savePaymentPlan(makeFormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.getRoster).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("교수 계정은 지급 계획을 수정할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      savePaymentPlan(makeFormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.getRoster).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
