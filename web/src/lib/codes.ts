
export const DEGREES = ["석사", "박사", "석박통합"] as const;
export type Degree = (typeof DEGREES)[number];

export const ACAD_STATUSES = [
  "재학",
  "휴학",
  "수료",
  "졸업",
  "제적",
] as const;

export const ACTIVITY_TYPES = ["RND", "LAB", "NONE"] as const;

export const FUNDS = [
  { code: "F11", group: "통합관리", name: "대학계정" },
  { code: "F12", group: "통합관리", name: "기관 세부계정" },
  { code: "F13", group: "통합관리", name: "연구책임자계정" },
  { code: "F20", group: "비통합관리 R&D", name: "정부·지자체·민간 R&D" },
  { code: "F30", group: "BK21", name: "BK21 장학금" },
  { code: "F40", group: "국고·지자체", name: "그 외 국고·지자체 지원" },
  { code: "F90", group: "기타", name: "기타" },
] as const;

export const LEDGER_ITEMS = [
  { code: "I_CARRY", direction: "IN", name: "전년도 잔액(이월)" },
  { code: "I_GOV", direction: "IN", name: "이공계 연구생활장려금(정부 지원)" },
  { code: "I_UNIV", direction: "IN", name: "대학 자체예산" },
  { code: "I_PI", direction: "IN", name: "연구책임자계정에서의 기관계정 대체액" },
  { code: "I_EXTRA", direction: "IN", name: "추가기여금" },
  { code: "I_REPAY", direction: "IN", name: "상환금" },
  { code: "I_INT", direction: "IN", name: "발생이자" },
  { code: "O_PAY", direction: "OUT", name: "학생인건비 지급" },
  { code: "O_ETC", direction: "OUT", name: "기타 지급" },
] as const;
