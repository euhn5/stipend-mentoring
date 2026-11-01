
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  studentMonthly,
  eligibilityResult,
  professor,
  srcAcademicMonthly,
  srcResearchHistory,
} from "@/db/schema";

import { diffFields } from "@/domain/checks";
import type { CheckResult } from "@/domain/checks";

import {
  countCumSupportMonths,
  judge,
} from "@/domain/eligibility";

import { loadRules } from "@/lib/rules";

// 명부 검색 조건
export type RosterFilter = {
  ym: string;
  degree?: string;
  dept?: string;
  advisor?: string;
  overall?: "O" | "X";
  q?: string;
};

// 명부 한 행의 자료형
type Student = typeof studentMonthly.$inferSelect;
type Eligibility = typeof eligibilityResult.$inferSelect;

export type RosterRow = Student & {
  professorName: string | null;
  professorResearcherNo: string | null;

  r1Status: string;
  r2Fulltime: string;
  r3Activity: string;
  r4Period: string;
  maxSupportYm: string | null;
  overall: string;
  standardAmount: number | null;

  chk01: CheckResult;
  chk02: CheckResult;
  chk03: CheckResult;
};

// CHK-01에서 비교할 학적 항목
const ACADEMIC_FIELDS = [
  "name",
  "degree",
  "researcherNo",
  "originUniv",
  "dept",
  "acadStatus",
  "semesterNo",
  "advisorId",
  "fulltimeYn",
  "activityType",
] as const;

function academicValues(
  row: Student | typeof srcAcademicMonthly.$inferSelect
) {
  return {
    name: row.name,
    degree: row.degree,
    researcherNo: row.researcherNo,
    originUniv: row.originUniv,
    dept: row.dept,
    acadStatus: row.acadStatus,
    semesterNo: row.semesterNo,
    advisorId: row.advisorId,
    fulltimeYn: row.fulltimeYn,
    activityType: row.activityType,
  };
}

/**
 * 학생연구자 명부 조회
 * - 학생 학적 + 지원요건 + 지도교수
 * - CHK-01, CHK-02, CHK-03
 * - 검색 필터 적용
 */
export async function getRoster(
  filter: RosterFilter
): Promise<RosterRow[]> {
  const rules = await loadRules();

  // 1. 기준월 학생 명부
  const students = await db
    .select()
    .from(studentMonthly)
    .where(eq(studentMonthly.baseYm, filter.ym));

  // 2. 같은 월의 지원요건 판정
  const results = await db
    .select()
    .from(eligibilityResult)
    .where(eq(eligibilityResult.baseYm, filter.ym));

  // 3. 교수 목록과 현재 원천 학적
  const professors = await db.select().from(professor);

  const sources = await db
    .select()
    .from(srcAcademicMonthly)
    .where(eq(srcAcademicMonthly.baseYm, filter.ym));

  // 4. 현재 원천 연구활동 이력
  const histories = await db
    .select()
    .from(srcResearchHistory);

  // 빠른 검색을 위한 Map
  const resultMap = new Map(
    results.map((r) => [r.studentNo, r])
  );

  const professorMap = new Map(
    professors.map((p) => [p.profId, p])
  );

  const sourceMap = new Map(
    sources
      .filter((s) => s.studentNo !== null)
      .map((s) => [s.studentNo!, s])
  );

  const rows: RosterRow[] = [];

  // 5. 학생별 명부 생성
  for (const student of students) {
    const result: Eligibility | undefined =
      resultMap.get(student.studentNo);

    // 판정 결과가 없다면 표시할 수 없으므로 제외
    if (!result) continue;

    const prof = professorMap.get(student.advisorId);
    const source = sourceMap.get(student.studentNo);

    // CHK-01: 학적 스냅샷 vs 원천 학적
    const chk01 = diffFields(
      academicValues(student),
      source ? academicValues(source) : null,
      [...ACADEMIC_FIELDS]
    );

    // CHK-02: 종합결과 vs 세부요건 AND
    const expectedOverall =
      result.r1Status === "O" &&
      result.r2Fulltime === "O" &&
      result.r3Activity === "O" &&
      result.r4Period === "O"
        ? "O"
        : "X";

    const chk02 = diffFields(
      { overall: result.overall },
      { overall: expectedOverall },
      ["overall"]
    );

    // CHK-03: 원천 현재 값으로 R1~R4 재판정
    let chk03: CheckResult;

    if (!source) {
      chk03 = {
        ok: false,
        diffs: [],
        note: "원천에 없음",
      };
    } else {
      const history = histories
        .filter(
          (h) =>
            h.studentNo === student.studentNo &&
            h.ym !== null
        )
        .map((h) => ({
          ym: h.ym!,
          activityType: h.activityType ?? "NONE",
        }));

      const cum = countCumSupportMonths(
        history,
        filter.ym,
        rules
      );

      const recalculated = judge(
        {
          baseYm: filter.ym,
          degree:
            source.degree as Parameters<typeof judge>[0]["degree"],
          acadStatus: source.acadStatus ?? "",
          fulltimeYn: source.fulltimeYn ?? "",
          activityType: source.activityType ?? "",
          semesterNo: source.semesterNo ?? 0,
          cumSupportMonths: cum,
        },
        rules
      );

      chk03 = diffFields(
        {
          r1Status: result.r1Status,
          r2Fulltime: result.r2Fulltime,
          r3Activity: result.r3Activity,
          r4Period: result.r4Period,
        },
        {
          r1Status: recalculated.r1,
          r2Fulltime: recalculated.r2,
          r3Activity: recalculated.r3,
          r4Period: recalculated.r4,
        },
        [
          "r1Status",
          "r2Fulltime",
          "r3Activity",
          "r4Period",
        ]
      );
    }

    rows.push({
      ...student,

      professorName: prof?.name ?? null,
      professorResearcherNo:
        prof?.researcherNo ?? null,

      r1Status: result.r1Status,
      r2Fulltime: result.r2Fulltime,
      r3Activity: result.r3Activity,
      r4Period: result.r4Period,
      maxSupportYm: result.maxSupportYm,
      overall: result.overall,
      standardAmount: result.standardAmount,

      chk01,
      chk02,
      chk03,
    });
  }

  // 6. 검색 조건 적용
  const q = filter.q?.trim().toLowerCase();

  return rows
    .filter((row) => {
      if (filter.degree && row.degree !== filter.degree) {
        return false;
      }

      if (filter.dept && row.dept !== filter.dept) {
        return false;
      }

      if (
        filter.advisor &&
        row.advisorId !== filter.advisor
      ) {
        return false;
      }

      if (
        filter.overall &&
        row.overall !== filter.overall
      ) {
        return false;
      }

      if (
        q &&
        !row.name.toLowerCase().includes(q) &&
        !row.studentNo.toLowerCase().includes(q)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) =>
      a.studentNo.localeCompare(b.studentNo)
    );
}
