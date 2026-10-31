
"use client";

import { useState } from "react";
import { runSyncAction } from "./actions";

type JobCode = "JOB-ACAD" | "JOB-PAY" | "JOB-ACCT";

export default function SyncForm() {
  const [jobCode, setJobCode] = useState<JobCode>("JOB-ACAD");

  const inputStyle = {
    padding: 10,
    border: "1px solid #64748b",
    borderRadius: 6,
    background: "#0f172a",
    color: "#f8fafc",
  };

  return (
    <form
      action={runSyncAction}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "end",
        marginTop: 20,
        flexWrap: "wrap",
      }}
    >
      <label>
        <span style={{ display: "block", marginBottom: 8 }}>
          연동 작업
        </span>

        <select
          name="jobCode"
          value={jobCode}
          onChange={(e) =>
            setJobCode(e.target.value as JobCode)
          }
          style={inputStyle}
        >
          <option value="JOB-ACAD">JOB-ACAD (학적)</option>
          <option value="JOB-PAY">JOB-PAY (지급)</option>
          <option value="JOB-ACCT">JOB-ACCT (기관계정)</option>
        </select>
      </label>

      {jobCode === "JOB-ACCT" ? (
        <>
          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              시작일
            </span>
            <input
              type="date"
              name="from"
              defaultValue="2026-01-01"
              required
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ display: "block", marginBottom: 8 }}>
              종료일
            </span>
            <input
              type="date"
              name="to"
              defaultValue="2026-06-30"
              required
              style={inputStyle}
            />
          </label>
        </>
      ) : (
        <label>
          <span style={{ display: "block", marginBottom: 8 }}>
            기준월
          </span>
          <input
            type="month"
            name="target"
            defaultValue="2026-03"
            required
            style={inputStyle}
          />
        </label>
      )}

      <button
        type="submit"
        style={{
          padding: "11px 20px",
          background: "#2563eb",
          color: "#fff",
          border: 0,
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        연동 실행
      </button>
    </form>
  );
}
