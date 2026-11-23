
import type { CheckResult } from "@/domain/checks";

type CheckCellProps = {
  label: string;
  result: CheckResult;
  variant?: "roster" | "payments";
};

export function CheckCell({
  label,
  result,
  variant = "roster",
}: CheckCellProps) {
  if (result.ok) {
    return (
      <span style={{ color: "#4ade80" }}>
        {label}: 일치
      </span>
    );
  }

  const isPayments = variant === "payments";

  return (
    <details>
      <summary
        style={{
          color: "#f87171",
          cursor: "pointer",
          fontWeight: 600,
          ...(isPayments ? { whiteSpace: "nowrap" as const } : {}),
        }}
      >
        {label}: 불일치
      </summary>

      <div
        style={
          isPayments
            ? {
                marginTop: 8,
                padding: 12,
                background: "#1e293b",
                borderRadius: 8,
                minWidth: 240,
                fontSize: 12,
                textAlign: "left" as const,
              }
            : {
                marginTop: 8,
                padding: 10,
                borderRadius: 6,
                background: "#1e293b",
                fontSize: 12,
                minWidth: 230,
              }
        }
      >
        {result.note && (
          isPayments ? (
            <p style={{ marginBottom: 8 }}>
              {result.note}
            </p>
          ) : (
            <p>{result.note}</p>
          )
        )}

        {result.diffs.map((diff) => (
          <div
            key={diff.field}
            style={
              isPayments
                ? { marginBottom: 10 }
                : { marginTop: 6 }
            }
          >
            <strong>
              {isPayments ? "재원/항목: " : ""}
              {diff.field}
            </strong>
            <div>
              본 시스템: {String(diff.ours ?? "-")}
            </div>
            <div>
              원천/기대값: {String(diff.source ?? "-")}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export function Status({ value }: { value: string }) {
  return (
    <strong
      style={{
        color: value === "O" ? "#4ade80" : "#f87171",
      }}
    >
      {value}
    </strong>
  );
}
