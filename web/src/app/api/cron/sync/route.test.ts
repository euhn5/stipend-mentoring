
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  runAcadJob: vi.fn(),
  runPayJob: vi.fn(),
  runAcctJob: vi.fn(),
}));

// 실제 Turso DB 대신 가짜 DB 사용
vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
  },
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

// 테스트 실행 날짜가 바뀌어도 동일한 기준월 사용
vi.mock("@/domain/month", () => ({
  previousYmKst: () => "2026-10",
  lastDayOf: () => "2026-10-31",
}));

import { GET } from "./route";

const SECRET = "cron-test-secret-not-for-production";

function makeRequest(authorized = true) {
  return new Request(
    "https://example.test/api/cron/sync",
    {
      headers: authorized
        ? { authorization: `Bearer ${SECRET}` }
        : {},
    },
  );
}

// 가짜 DB 조회 결과 설정
function mockSourceRows(rows: { srcId: string }[]) {
  return {
    from: () => ({
      where: () => ({
        limit: async () => rows,
      }),
    }),
  };
}

describe("Cron 자동 연동 API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("CRON_SECRET", SECRET);

    // 기본값: 학적과 지급 원천 데이터 모두 존재
    mocks.select.mockImplementation(() =>
      mockSourceRows([{ srcId: "TEST-001" }]),
    );

    mocks.runAcadJob.mockResolvedValue({
      syncId: 1,
      status: "SUCCESS",
    });

    mocks.runPayJob.mockResolvedValue({
      syncId: 2,
      status: "SUCCESS",
    });

    mocks.runAcctJob.mockResolvedValue({
      syncId: 3,
      status: "SUCCESS",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("비밀키가 없으면 401을 반환한다", async () => {
    const response = await GET(makeRequest(false));

    expect(response.status).toBe(401);
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.runAcadJob).not.toHaveBeenCalled();
  });

  it("학적 원천 데이터가 없으면 연동하지 않는다", async () => {
    mocks.select
      .mockImplementationOnce(() => mockSourceRows([]))
      .mockImplementationOnce(() =>
        mockSourceRows([{ srcId: "PAY-001" }]),
      );

    const response = await GET(makeRequest());
    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.status).toBe("SKIPPED");
    expect(result.academicReady).toBe(false);
    expect(result.paymentReady).toBe(true);

    expect(mocks.runAcadJob).not.toHaveBeenCalled();
    expect(mocks.runPayJob).not.toHaveBeenCalled();
    expect(mocks.runAcctJob).not.toHaveBeenCalled();
  });

  it("모든 작업이 성공하면 SUCCESS를 반환한다", async () => {
    const response = await GET(makeRequest());
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe("SUCCESS");
    expect(result.ym).toBe("2026-10");

    expect(mocks.runAcadJob).toHaveBeenCalledWith(
      "2026-10",
      "SCHEDULE",
    );

    expect(mocks.runPayJob).toHaveBeenCalledWith(
      "2026-10",
      "SCHEDULE",
    );

    expect(mocks.runAcctJob).toHaveBeenCalledWith(
      "2026-10-01",
      "2026-10-31",
      "SCHEDULE",
    );

    const acadOrder =
      mocks.runAcadJob.mock.invocationCallOrder[0];
    const payOrder =
      mocks.runPayJob.mock.invocationCallOrder[0];
    const acctOrder =
      mocks.runAcctJob.mock.invocationCallOrder[0];

    expect(acadOrder).toBeLessThan(payOrder);
    expect(payOrder).toBeLessThan(acctOrder);
  });

  it("학적 연동에 실패하면 후속 작업을 중단한다", async () => {
    mocks.runAcadJob.mockResolvedValue({
      syncId: 1,
      status: "FAILED",
    });

    const response = await GET(makeRequest());
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.failedJob).toBe("JOB-ACAD");

    expect(mocks.runPayJob).not.toHaveBeenCalled();
    expect(mocks.runAcctJob).not.toHaveBeenCalled();
  });
});
