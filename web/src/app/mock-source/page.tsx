
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  srcAcademicMonthly,
  srcPayment,
} from "@/db/schema";

import {
  updateAcademicSource,
  updatePaymentSource,
} from "./actions";

type SearchParams = {
  table?: string;
  ym?: string;
  message?: string;
};

const inputStyle = {
  padding: 8,
  border: "1px solid #475569",
  borderRadius: 6,
  background: "#0f172a",
  color: "#f8fafc",
  minWidth: 110,
};

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #334155",
  whiteSpace: "nowrap" as const,
};

const buttonStyle = {
  background: "#2563eb",
  color: "#fff",
  padding: "9px 14px",
  border: 0,
  borderRadius: 6,
  cursor: "pointer",
};

export default async function MockSourcePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // 운영 환경에서는 Mock 원천 편집 페이지 접근 차단
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;

  const table =
    params.table === "payment" ? "payment" : "academic";

  const ym = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.ym ?? "")
    ? params.ym!
    : "2026-03";

  const academicRows =
    table === "academic"
      ? await db
          .select()
          .from(srcAcademicMonthly)
          .where(eq(srcAcademicMonthly.baseYm, ym))
          .orderBy(asc(srcAcademicMonthly.studentNo))
      : [];

  const paymentRows =
    table === "payment"
      ? await db
          .select()
          .from(srcPayment)
          .where(eq(srcPayment.baseYm, ym))
          .orderBy(asc(srcPayment.studentNo))
      : [];

  return (
    <main
      style={{
        padding: 32,
        maxWidth: 1500,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>
        Mock 원천 편집
      </h1>

      <p style={{ marginTop: 8, color: "#94a3b8" }}>
        학적 및 지급 원천 데이터를 수정하고
        연동 작업으로 변경 사항을 반영합니다.
      </p>

      <section
        style={{
          marginTop: 28,
          padding: 24,
          border: "1px solid #475569",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 20 }}>
          조회 조건
        </h2>

        <form
          method="get"
          action="/mock-source"
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "end",
            marginTop: 20,
          }}
        >
          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              원천 테이블
            </span>

            <select
              name="table"
              defaultValue={table}
              style={inputStyle}
            >
              <option value="academic">
                학적 (src_academic_monthly)
              </option>
              <option value="payment">
                지급 (src_payment)
              </option>
            </select>
          </label>

          <label>
            <span
              style={{
                display: "block",
                marginBottom: 8,
              }}
            >
              기준월
            </span>

            <input
              type="month"
              name="ym"
              defaultValue={ym}
              required
              style={inputStyle}
            />
          </label>

          <button type="submit" style={buttonStyle}>
            조회
          </button>
        </form>
      </section>

      {params.message && (
        <section
          style={{
            marginTop: 20,
            padding: 16,
            background: "#1e293b",
            borderRadius: 8,
          }}
        >
          {params.message}
        </section>
      )}

      <section
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #475569",
          borderRadius: 8,
        }}
      >
        <strong>사용 방법</strong>
        <p style={{ marginTop: 8, color: "#94a3b8" }}>
          원하는 행에서 값을 수정하고 저장하세요.
          이 화면은 원천 테이블만 변경합니다.
          실제 학생 명부나 지급내역에 반영하려면
          연동관리를 실행해야 합니다.
        </p>

        <Link
          href="/sync"
          style={{
            display: "inline-block",
            marginTop: 12,
            color: "#93c5fd",
            textDecoration: "underline",
          }}
        >
          연동관리로 이동
        </Link>
      </section>

      {/* 학적 원천 목록 */}
      {table === "academic" && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>
            {ym} 학적 원천 목록 ({academicRows.length}건)
          </h2>

          <p style={{ marginBottom: 16, color: "#94a3b8" }}>
            학과와 학위를 수정할 수 있습니다.
            학위에 잘못된 코드를 입력하면 JOB-ACAD
            연동 시 E_CODE 검증도 실습할 수 있습니다.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#1e293b" }}>
                  {[
                    "원천 ID",
                    "학번",
                    "이름",
                    "학적상태",
                    "학과",
                    "학위",
                    "저장",
                  ].map((heading) => (
                    <th key={heading} style={cellStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {academicRows.map((row) => {
                  const formId = `academic-${row.srcId}`;

                  return (
                    <tr key={row.srcId}>
                      <td style={cellStyle}>
                        {row.srcId}
                      </td>

                      <td style={cellStyle}>
                        {row.studentNo ?? "-"}
                      </td>

                      <td style={cellStyle}>
                        {row.name ?? "-"}
                      </td>

                      <td style={cellStyle}>
                        {row.acadStatus ?? "-"}
                      </td>

                      <td style={cellStyle}>
                        <input
                          form={formId}
                          name="dept"
                          aria-label={`${row.studentNo} 학과`}
                          defaultValue={row.dept ?? ""}
                          required
                          style={{ ...inputStyle, width: 180 }}
                        />
                      </td>

                      <td style={cellStyle}>
                        <input
                          form={formId}
                          name="degree"
                          aria-label={`${row.studentNo} 학위`}
                          defaultValue={row.degree ?? ""}
                          required
                          style={{ ...inputStyle, width: 110 }}
                        />
                      </td>

                      <td style={cellStyle}>
                        <form
                          id={formId}
                          action={updateAcademicSource}
                        >
                          <input
                            type="hidden"
                            name="srcId"
                            value={row.srcId}
                          />
                          <input
                            type="hidden"
                            name="ym"
                            value={ym}
                          />

                          <button
                            type="submit"
                            style={buttonStyle}
                          >
                            저장
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {academicRows.length === 0 && (
              <p style={{ padding: 24 }}>
                해당 월 학적 원천 데이터가 없습니다.
              </p>
            )}
          </div>
        </section>
      )}

      {/* 지급 원천 목록 */}
      {table === "payment" && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>
            {ym} 지급 원천 목록 ({paymentRows.length}건)
          </h2>

          <p style={{ marginBottom: 16, color: "#94a3b8" }}>
            재원 코드와 지급 금액을 수정할 수 있습니다.
            저장 후 JOB-PAY를 실행하면 변경된 지급
            데이터가 시스템에 반영됩니다.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#1e293b" }}>
                  {[
                    "원천 ID",
                    "학번",
                    "시스템",
                    "지급일",
                    "재원 코드",
                    "지급액",
                    "저장",
                  ].map((heading) => (
                    <th key={heading} style={cellStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paymentRows.map((row) => {
                  const formId = `payment-${row.srcId}`;

                  return (
                    <tr key={row.srcId}>
                      <td style={cellStyle}>
                        {row.srcId}
                      </td>

                      <td style={cellStyle}>
                        {row.studentNo ?? "-"}
                      </td>

                      <td style={cellStyle}>
                        {row.systemCode ?? "-"}
                      </td>

                      <td style={cellStyle}>
                        {row.paidDate ?? "-"}
                      </td>

                      <td style={cellStyle}>
                        <input
                          form={formId}
                          name="fundCode"
                          aria-label={`${row.srcId} 재원 코드`}
                          defaultValue={row.fundCode ?? ""}
                          required
                          style={{ ...inputStyle, width: 110 }}
                        />
                      </td>

                      <td style={cellStyle}>
                        <input
                          form={formId}
                          name="amount"
                          aria-label={`${row.srcId} 지급액`}
                          type="number"
                          min={0}
                          step={1}
                          defaultValue={row.amount ?? ""}
                          required
                          style={{ ...inputStyle, width: 150 }}
                        />
                      </td>

                      <td style={cellStyle}>
                        <form
                          id={formId}
                          action={updatePaymentSource}
                        >
                          <input
                            type="hidden"
                            name="srcId"
                            value={row.srcId}
                          />
                          <input
                            type="hidden"
                            name="ym"
                            value={ym}
                          />

                          <button
                            type="submit"
                            style={buttonStyle}
                          >
                            저장
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {paymentRows.length === 0 && (
              <p style={{ padding: 24 }}>
                해당 월 지급 원천 데이터가 없습니다.
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
