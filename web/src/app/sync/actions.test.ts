
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from "vitest";

// 테스트에서 사용할 가짜 함수
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  runAcadJob: vi.fn(),
  runPayJob: vi.fn(),
  runAcctJob: vi.fn(),
  redirect: vi.fn(),
}));

// 실제 인증 및 연동 작업 대신 가짜 함수 사용
vi.mock("@/lib/authorization", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/jobs/acad", () => ({
  runAcadJob: mocks.runAcadJob,
}));

vi.mock("@/jobs/pay", () => ({
  runPayJob: mocks.runPayJob,
}));

vi.mock("@/jobs/acct", () => ({
  runAcctJob: mocks.runAcctJob,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { runSyncAction } from "./actions";

function makeFormData() {
  const formData = new FormData();
  formData.set("jobCode", "JOB-ACAD");
  formData.set("target", "2026-03");
  return formData;
}

describe("수동 연동 서버 액션 권한 검사", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("미로그인 사용자는 연동을 실행할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      runSyncAction(makeFormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.runAcadJob).not.toHaveBeenCalled();
    expect(mocks.runPayJob).not.toHaveBeenCalled();
    expect(mocks.runAcctJob).not.toHaveBeenCalled();
  });

  it("교수 계정은 연동을 실행할 수 없다", async () => {
    mocks.requireAdmin.mockRejectedValueOnce(
      new Error("관리자 권한이 필요합니다.")
    );

    await expect(
      runSyncAction(makeFormData())
    ).rejects.toThrow("관리자 권한이 필요합니다.");

    expect(mocks.runAcadJob).not.toHaveBeenCalled();
    expect(mocks.runPayJob).not.toHaveBeenCalled();
    expect(mocks.runAcctJob).not.toHaveBeenCalled();
  });

  it("관리자는 학적 연동을 실행할 수 있다", async () => {
    mocks.requireAdmin.mockResolvedValueOnce({
      userId: "admin",
      role: "ADMIN",
      profId: null,
    });

    mocks.runAcadJob.mockResolvedValueOnce({
      syncId: 123,
    });

    await runSyncAction(makeFormData());

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.runAcadJob).toHaveBeenCalledWith(
      "2026-03",
      "MANUAL"
    );
    expect(mocks.runPayJob).not.toHaveBeenCalled();
    expect(mocks.runAcctJob).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sync?syncId=123"
    );
  });
});
