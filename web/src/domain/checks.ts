
export type FieldDiff = {
  field: string;
  ours: unknown;
  source: unknown;
};

export type CheckResult = {
  ok: boolean;
  diffs: FieldDiff[];
  note?: string;
};

/**
 * 연동된 데이터(ours)와 원천 데이터(source)를 비교한다.
 *
 * 지정한 필드의 값이 모두 같으면 ok=true
 * 하나라도 다르면 ok=false와 차이 목록 반환
 * 한쪽 데이터가 없으면 note에 이유 기록
 */
export function diffFields<T extends Record<string, unknown>>(
  ours: T | null,
  source: T | null,
  fields: (keyof T)[]
): CheckResult {
  if (ours === null || source === null) {
    return {
      ok: false,
      diffs: [],
      note:
        ours === null && source === null
          ? "양쪽 데이터가 모두 없음"
          : ours === null
          ? "연동 데이터가 없음"
          : "원천에 없음",
    };
  }

  const diffs: FieldDiff[] = [];

  for (const field of fields) {
    if (ours[field] !== source[field]) {
      diffs.push({
        field: String(field),
        ours: ours[field],
        source: source[field],
      });
    }
  }

  return {
    ok: diffs.length === 0,
    diffs,
  };
}
