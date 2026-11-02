
import { termMonths } from "@/domain/month";
import {
  getPayments,
  type PaymentRow,
} from "@/queries/payments";

export type SemesterMonth = {
  ym: string;
  data: PaymentRow | null;
};

export type SemesterStudent = {
  studentNo: string;
  name: string;
  degree: string;
  dept: string;
  advisorId: string;
  professorName: string | null;
  months: SemesterMonth[];
  totalPaid: number;
  totalShortage: number;
  shortageMonths: number;
};

export type SemesterResult = {
  term: string;
  months: string[];
  students: SemesterStudent[];
  totalPaid: number;
  totalShortage: number;
};

// 한 학기의 6개월 지급 데이터를 조회한다.
export async function getSemester(
  term: string
): Promise<SemesterResult> {
  const months = termMonths(term);

  // 기존 getPayments() 재사용
  const monthlyData = await Promise.all(
    months.map((ym) => getPayments({ ym }))
  );

  // 학생별 자료를 하나로 합친다.
  const studentMap = new Map<
    string,
    Map<string, PaymentRow>
  >();

  for (let index = 0; index < months.length; index++) {
    const ym = months[index];

    for (const row of monthlyData[index]) {
      if (!studentMap.has(row.studentNo)) {
        studentMap.set(row.studentNo, new Map());
      }

      studentMap.get(row.studentNo)!.set(ym, row);
    }
  }

  const students: SemesterStudent[] = [];

  for (const [studentNo, monthMap] of studentMap) {
    // 해당 학기에서 가장 최근에 조회된 학생 정보
    const latest = [...monthMap.values()].at(-1);

    if (!latest) continue;

    const studentMonths: SemesterMonth[] =
      months.map((ym) => ({
        ym,
        data: monthMap.get(ym) ?? null,
      }));

    const totalPaid = studentMonths.reduce(
      (sum, month) =>
        sum + (month.data?.totalPaid ?? 0),
      0
    );

    const totalShortage = studentMonths.reduce(
      (sum, month) =>
        sum + (month.data?.shortageAmount ?? 0),
      0
    );

    const shortageMonths = studentMonths.filter(
      (month) =>
        month.data?.shortageAmount !== null &&
        month.data?.shortageAmount !== undefined &&
        month.data.shortageAmount > 0
    ).length;

    students.push({
      studentNo,
      name: latest.name,
      degree: latest.degree,
      dept: latest.dept,
      advisorId: latest.advisorId,
      professorName: latest.professorName,
      months: studentMonths,
      totalPaid,
      totalShortage,
      shortageMonths,
    });
  }

  students.sort((a, b) =>
    a.studentNo.localeCompare(b.studentNo)
  );

  return {
    term,
    months,
    students,
    totalPaid: students.reduce(
      (sum, student) => sum + student.totalPaid,
      0
    ),
    totalShortage: students.reduce(
      (sum, student) => sum + student.totalShortage,
      0
    ),
  };
}
