
import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { ruleConfig } from "@/db/schema";
import {
  DEGREES,
  ACAD_STATUSES,
  ACTIVITY_TYPES,
  FUNDS,
  LEDGER_ITEMS,
} from "@/lib/codes";
import { saveRuleConfig } from "./actions";

const inputStyle = {
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #475569",
  borderRadius: 8,
  padding: "10px 12px",
  width: "100%",
};

const cellStyle = {
  padding: 14,
  borderBottom: "1px solid #334155",
  verticalAlign: "middle" as const,
};

function getCategory(key: string): string {
  if (key.startsWith("eligible.")) {
    return "지원요건";
  }

  if (key.startsWith("max_months.")) {
    return "최대 지원기간";
  }

  if (key.startsWith("standard_amount.")) {
    return "기준금액";
  }

  if (key.startsWith("integrated.")) {
    return "석박통합 기준";
  }

  return "기타";
}

function CodeTable({
  title,
  items,
}: {
  title: string;
  items: {
    code: string;
    description: string;
  }[];
}) {
  return (
    <section style={{ marginTop: 28 }}>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 12,
        }}
      >
        {title}
      </h3>

      <div
        style={{
          overflowX: "auto",
          border: "1px solid #334155",
          borderRadius: 10,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead style={{ background: "#1e293b" }}>
            <tr>
              <th style={cellStyle}>코드</th>
              <th style={cellStyle}>설명</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.code}>
                <td style={cellStyle}>
                  <strong>{item.code}</strong>
                </td>

                <td style={cellStyle}>
                  {item.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function SettingsPage() {
  const rules = await db
    .select()
    .from(ruleConfig)
    .orderBy(asc(ruleConfig.key));

  const categories = [
    "지원요건",
    "최대 지원기간",
    "기준금액",
    "석박통합 기준",
    "기타",
  ];

  return (
    <main
      style={{
        maxWidth: 1450,
        margin: "0 auto",
        padding: 32,
      }}
    >
      <h1
        style={{
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        기준정보 관리
      </h1>

      <p
        style={{
          marginTop: 10,
          color: "#94a3b8",
        }}
      >
        연구생활장려금 지원요건, 최대 지원기간,
        기준금액 및 업무 코드표를 조회합니다.
      </p>

      <section
        style={{
          marginTop: 28,
          padding: 24,
          background: "#1e293b",
          borderRadius: 12,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          기준정보 현황
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 40,
            marginTop: 20,
          }}
        >
          <div>
            <p style={{ color: "#94a3b8" }}>
              등록된 업무 규칙
            </p>

            <strong
              style={{
                display: "block",
                marginTop: 8,
                fontSize: 28,
              }}
            >
              {rules.length}개
            </strong>
          </div>

          <div>
            <p style={{ color: "#94a3b8" }}>
              수정 이력
            </p>

            <Link
              href="/audit?table=rule_config&actor=admin"
              style={{
                display: "inline-block",
                marginTop: 12,
                color: "#93c5fd",
                textDecoration: "underline",
              }}
            >
              감사로그에서 확인
            </Link>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          업무 규칙 설정
        </h2>

        <p
          style={{
            color: "#94a3b8",
            marginTop: 8,
            marginBottom: 18,
          }}
        >
          각 항목의 값을 변경한 뒤 저장하세요.
          수정된 값은 데이터베이스에 저장되고
          감사로그에 기록됩니다.
        </p>

        {categories.map((category) => {
          const categoryRules = rules.filter(
            (rule) =>
              getCategory(rule.key) === category
          );

          if (categoryRules.length === 0) {
            return null;
          }

          return (
            <section
              key={category}
              style={{ marginTop: 28 }}
            >
              <h3
                style={{
                  fontSize: 19,
                  marginBottom: 14,
                }}
              >
                {category}
              </h3>

              <div
                style={{
                  overflowX: "auto",
                  border: "1px solid #334155",
                  borderRadius: 10,
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: 850,
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead
                    style={{
                      background: "#1e293b",
                    }}
                  >
                    <tr>
                      <th style={cellStyle}>
                        설정 키
                      </th>
                      <th style={cellStyle}>
                        설명
                      </th>
                      <th style={cellStyle}>
                        설정값
                      </th>
                      <th style={cellStyle}>
                        저장
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {categoryRules.map((rule, index) => {
                      const formId =
                        `rule-form-${category}-${index}`;

                      return (
                        <tr key={rule.key}>
                          <td style={cellStyle}>
                            <code>{rule.key}</code>
                          </td>

                          <td style={cellStyle}>
                            {rule.description}
                          </td>

                          <td style={cellStyle}>
                            <form
                              id={formId}
                              action={saveRuleConfig}
                            >
                              <input
                                type="hidden"
                                name="key"
                                value={rule.key}
                              />

                              <input
                                type="text"
                                name="value"
                                defaultValue={rule.value}
                                required
                                aria-label={`${rule.key} 설정값`}
                                style={inputStyle}
                              />
                            </form>
                          </td>

                          <td style={cellStyle}>
                            <button
                              form={formId}
                              type="submit"
                              style={{
                                padding: "10px 18px",
                                background: "#2563eb",
                                color: "#fff",
                                border: 0,
                                borderRadius: 8,
                                cursor: "pointer",
                              }}
                            >
                              저장
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </section>

      <section style={{ marginTop: 44 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          업무 코드표 조회
        </h2>

        <p
          style={{
            marginTop: 8,
            color: "#94a3b8",
          }}
        >
          아래 코드표는 프로그램에서 정의한
          코드 목록으로 이 화면에서는 조회만 가능합니다.
        </p>

        <CodeTable
          title="학위 코드"
          items={DEGREES.map((degree) => ({
            code: degree,
            description: `${degree} 과정`,
          }))}
        />

        <CodeTable
          title="학적상태 코드"
          items={ACAD_STATUSES.map((status) => ({
            code: status,
            description: status,
          }))}
        />

        <CodeTable
          title="연구활동 유형"
          items={ACTIVITY_TYPES.map((activity) => ({
            code: activity,
            description: activity,
          }))}
        />

        <CodeTable
          title="지급 재원 코드"
          items={FUNDS.map((fund) => ({
            code: fund.code,
            description: `${fund.group} · ${fund.name}`,
          }))}
        />

        <CodeTable
          title="기관계정 거래 항목 코드"
          items={LEDGER_ITEMS.map((item) => ({
            code: item.code,
            description: `${item.direction} · ${item.name}`,
          }))}
        />
      </section>
    </main>
  );
}
