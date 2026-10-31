# 이공계 연구생활장려금 관리시스템 — 멘토링 프로젝트 가이드

동국대학교 「nDRIMS 이공계 연구생활장려금 지원사업 전산시스템 구축 사업」 제안요청서(RFP)를 바탕으로, 실제 업무 시스템과 비슷한 웹 서비스를 **혼자서 처음부터** 만들고, 마지막에 GitHub에 올려 호스팅까지 시도해 보는 프로젝트입니다.

이 README는 **어떻게 만드는지**를 순서대로 안내합니다. **무엇을 만드는지**는 [docs/요구사항.md](docs/요구사항.md)에 있습니다.

---

## 이 문서를 읽는 방법

- **VS Code에서는 미리보기로 읽습니다.** md 파일을 연 뒤 `Ctrl+Shift+V`(macOS는 `Cmd+Shift+V`)를 누르면 표·링크·코드 블록이 정리된 화면으로 보입니다. `Ctrl+K` 누른 뒤 `V`(macOS는 `Cmd+K` 누른 뒤 `V`)를 누르면 원문 옆에 나란히 열립니다. 미리보기에서는 목차 링크를 눌러 해당 절로 바로 이동할 수 있습니다.
- **Step 1부터 순서대로** 진행합니다. 각 Step은 앞 Step의 결과물을 전제로 합니다.
- 각 Step은 아래 순서로 구성되어 있습니다.
  - **목표**: 이 Step이 끝나면 무엇이 되어 있어야 하는지
  - **먼저 읽기**: 시작 전에 읽을 요구사항 절
  - **할 일**: 만들 파일과 구현 내용
  - **완료 확인**: 다음 Step으로 넘어가도 되는지 판단하는 체크리스트. **모두 체크되기 전에는 넘어가지 않습니다.**
- 명령어 블록은 그대로 복사해서 실행하면 됩니다. 별도 표시가 없으면 **`web/` 폴더에서** 실행합니다.
- 이 문서의 설치·설정 명령과 시작 파일(`docs/starter/`)은 2026-10-29에 아래 버전으로 실제 실행해 검증했습니다. **버전을 바꾸지 말고 적힌 그대로** 설치하세요.
- **처음 보는 용어**가 나오면 [핵심 개념](#핵심-개념--시작-전에-꼭-알아야-할-것)을 먼저 읽고, 그래도 없으면 [요구사항 2.1 용어 사전](docs/요구사항.md#21-용어-사전)(업무·시스템 용어)과 [G. 기술 용어 사전](#g-기술-용어-사전)(Next.js, DB, Git 등)을 찾아봅니다.
- 요구사항이 모호하게 느껴지면 먼저 [요구사항 9장 정답표](docs/요구사항.md#9-인수-시나리오-테스트-데이터)를 봅니다. 정답표와 맞게 나오는 구현이 맞는 구현입니다.

### 진행 방식

- 이 폴더(zip)를 받은 뒤 **혼자서** Step 1부터 진행합니다. 중간 점검은 없습니다.
- 버전 관리는 **내 컴퓨터의 Git**으로 합니다 (Step 3에서 시작). Step마다 커밋합니다.
- 마지막 Step에서 GitHub에 올리고 호스팅을 시도한 뒤, 회고를 써서 멘토에게 보내면 멘토링이 끝납니다.
- 하루 이상 막히면, 시도한 것과 오류 메시지를 정리해서 멘토에게 질문합니다.

---

## 목차

**시작 전에 읽기**: [프로젝트 소개](#프로젝트-소개) → [핵심 개념](#핵심-개념--시작-전에-꼭-알아야-할-것)

**진행 단계**

| Step | 내용 | 우선순위 |
|---|---|---|
| [1](#step-1--개발-환경-설치) | 개발 환경 설치 | 준비 |
| [2](#step-2--프로젝트-폴더-준비) | 프로젝트 폴더 준비와 요구사항 읽기 | 준비 |
| [3](#step-3--프로젝트-생성) | 프로젝트 생성, 시작 파일 적용, Git 시작 | 준비 |
| [4](#step-4--공통-기반) | 공통 기반 (코드표, 규칙 설정, 표시 형식, 레이아웃) | P1 |
| [5](#step-5--판정-엔진) | 판정 엔진 (지원요건, 기준금액, 학기) | P1 |
| [6](#step-6--연동-골격과-학적-연동-job-acad) | 연동 골격과 학적 연동 (JOB-ACAD) | P1 |
| [7](#step-7--지급-연동-기관계정-연동-자동-연동-api) | 지급 연동 (JOB-PAY), 기관계정 연동 (JOB-ACCT), 자동 연동 API | P1 |
| [8](#step-8--학생연구자-명부-화면) | 학생연구자 명부 화면 | P1 |
| [9](#step-9--지급내역-화면) | 지급내역 화면 | P1 |
| [10](#step-10--기관계정-원장-화면) | 기관계정 원장 화면 | P1 |
| [11](#step-11--감사로그와-mock-원천-편집-화면) | 감사로그, Mock 원천(가짜 원천 데이터) 편집 화면 | P1 |
| [12](#step-12--p2-화면) | P2 화면 (대시보드, 학기, 정합성 점검 등) | P2 |
| [13](#step-13--로그인과-권한-p2) | 로그인과 권한 | P2 |
| [14](#step-14--최종-테스트와-인수-점검) | 최종 테스트와 인수 점검 | 마무리 |
| [15](#step-15--github에-올리고-호스팅해-보기) | GitHub에 올리고 호스팅해 보기 | 마무리 |
| [16](#step-16--회고) | 회고 | 마무리 |

**참고 자료**

- [A. 시스템 명세](#a-시스템-명세) — 구성도, 기술 스택, 폴더 구조, 데이터 모델, 화면 경로, 코드 규칙
- [B. 모듈 인터페이스](#b-모듈-인터페이스) — 직접 만들 함수의 이름과 입출력
- [C. 연동 Job 처리 절차](#c-연동-job-처리-절차)
- [D. AI 도구 활용 가이드](#d-ai-도구-활용-가이드)
- [E. Git 사용 방법](#e-git-사용-방법)
- [F. 문제 해결 FAQ](#f-문제-해결-faq)
- [G. 기술 용어 사전](#g-기술-용어-사전)

---

## 프로젝트 소개

### 무엇을 만드나

대학원생 연구자에게 매달 지급하는 지원금을 관리하는 **업무 시스템**입니다. 담당자는 이 시스템으로 아래 일을 합니다.

1. 학생마다 **이번 달 지원 대상인지(지원요건 O/X)** 확인
2. 여러 재원에서 나간 **지급액이 기준금액에 미달하지 않는지** 확인
3. 지원금 재원인 **대학 계정의 수입·지급·잔액** 확인
4. 위 데이터가 **원천 시스템(데이터를 원래 가지고 있는 학적·지급·회계 시스템)의 데이터와 일치하는지** 자동 검증

### 이 프로젝트에서 배우는 것

- 모호한 RFP를 명확한 명세로 바꾼 문서를 읽고, 명세대로 끝까지 구현하는 경험
- 업무 시스템의 핵심 패턴: **원천 연동, 규칙 판정, 정합성 검증, 감사로그**
- 테스트로 업무 규칙을 검증하는 습관
- Git 버전 관리, GitHub 업로드, 호스팅 환경이 로컬과 어떻게 다른지
- AI 코딩 도구를 쓰되, 결과를 명세와 테스트로 검증하는 방법

### 전달받은 폴더 구성

```
stipend-mentoring/            ← zip을 푼 폴더 (이름과 위치는 Step 2 참고)
├── README.md                 ← 지금 읽는 문서
├── AGENTS.md, CLAUDE.md      ← AI 도구 규칙 (Step 3에서 만듦)
├── docs/
│   ├── 요구사항.md             ← 무엇을 만드는가
│   ├── 별첨4_요구사항.md        ← 원본 RFP 발췌 (참고용)
│   └── starter/              ← 검증된 시작 파일 (Step 3에서 복사)
└── web/                      ← Next.js 앱 (Step 3에서 만듦)
```

## 핵심 개념 — 시작 전에 꼭 알아야 할 것

이 프로젝트에는 처음 보면 낯선 용어가 많습니다. Step 1을 시작하기 전에 이 절을 한 번 읽어 두면 나머지 문서를 훨씬 쉽게 읽을 수 있습니다. 전체 용어 목록은 [요구사항 2.1 용어 사전](docs/요구사항.md#21-용어-사전)(업무·시스템 용어)과 [G. 기술 용어 사전](#g-기술-용어-사전)(Next.js, DB, Git 등)에 있습니다.

### 1. 데이터는 "원천"에서 가져온다

이 시스템은 학생 정보나 지급 내역을 사람이 직접 입력하지 않습니다. 실제 대학에서는 이런 데이터가 이미 다른 시스템에 있습니다. 학적은 학사 시스템에, 지급 내역은 각 재원의 지급 시스템에, 대학 계정 거래는 회계 시스템에 있습니다. 이렇게 **데이터를 원래 가지고 있는 시스템을 "원천 시스템"** 이라고 부릅니다.

그런데 우리는 동국대의 실제 원천 시스템에 접근할 수 없습니다. 그래서 **원천 시스템을 흉내 낸 가짜 테이블을 같은 DB 안에 만들어 씁니다.** 이렇게 실제를 흉내 낸 가짜를 **Mock(목)** 이라고 합니다. Mock 원천 테이블은 이름이 `src_`(source, 원천)로 시작합니다.

| 진짜라면 | 이 프로젝트에서는 |
|---|---|
| 동국대 학사 시스템 | `src_professor`, `src_academic_monthly`, `src_research_history` 테이블 |
| 각 재원의 지급 시스템 | `src_payment` 테이블 |
| 대학 회계 시스템 | `src_account_txn`, `src_account_summary` 테이블 |

### 2. 원천에서 가져오는 작업이 "연동"이고, 연동 한 종류가 "Job"이다

원천 데이터를 읽어서 우리 시스템 테이블로 복사해 오는 일을 **연동**이라고 합니다. 원천이 세 개이므로 연동 작업(Job)도 세 개입니다. 영어 코드는 화면·DB·테스트에 그대로 나오므로 한글 이름과 함께 기억해 둡니다.

| 한글 이름 | 코드 | 뜻 | 하는 일 |
|---|---|---|---|
| 학적 연동 | `JOB-ACAD` | ACAD = Academic(학적) | 학사 시스템 → **명부**(학생 목록). 가져온 뒤 지원요건을 판정한다 |
| 지급 연동 | `JOB-PAY` | PAY = Payment(지급) | 지급 시스템 → **지급내역** |
| 기관계정 연동 | `JOB-ACCT` | ACCT = Account(계정) | 회계 시스템 → **기관계정 원장**(거래 장부) |

연동은 담당자가 화면의 버튼으로 실행하거나(수동), 스케줄러가 매달 자동으로 실행합니다(자동). 원천에 이상한 값이 있으면 그 행은 건너뛰고 **연동 오류**로 기록합니다.

### 3. 가져온 학적으로 "판정"한다

학적 연동이 끝나면 학생마다 이번 달 지원 대상인지 **판정**합니다. 조건은 4가지(R1~R4)이고, 모두 충족해야 **종합 O**입니다.

| 조건 | 내용 |
|---|---|
| R1 학적상태 | 재학 중인가 |
| R2 전일제 | 다른 직장 없이 연구에 전념하는가 |
| R3 연구활동 | 연구활동(RND·LAB)을 하고 있는가 |
| R4 지원기간 | 지원받을 수 있는 최대 개월 수를 넘지 않았는가 |

종합 O인 학생은 한 달에 최소한 받아야 하는 금액(**기준금액**, 석사 80만 원·박사 110만 원)이 있습니다. 여러 재원에서 받은 돈을 합친 **총지급액**이 기준금액보다 적으면 그 차이가 **부족금액**입니다.

### 4. 원천이 나중에 바뀌면 "정합성 검증"으로 잡아낸다

연동은 그 시점의 원천 데이터를 복사해 오는 것이므로, 연동한 뒤에 원천이 바뀌면 우리 데이터와 원천이 달라집니다. 화면을 열 때마다 **우리가 복사해 둔 값과 원천의 현재 값을 자동으로 비교**해서 `일치`/`불일치`로 보여 주는 것이 **정합성 검증**입니다. 비교 항목이 8가지라 `CHK-01`~`CHK-08`(CHK = Check)로 번호를 붙였습니다.

> 예: S07 학생을 연동한 뒤 원천에서 학과를 바꾸면 → 명부 화면에 `CHK-01 불일치` → 학적 연동을 다시 실행하면 → `일치`

### 5. 모든 변경은 "감사로그"에 남는다

연동이든 사람이 고친 것이든, 우리 시스템의 데이터가 바뀌면 **누가·언제·무엇을·어떻게(전/후 값)** 바꿨는지 기록합니다. 이것이 **감사로그**입니다. 연동이 바꾼 경우 "누가"는 `SYSTEM:JOB-ACAD`처럼 Job 이름으로 남습니다.

같은 연동을 두 번 실행해도, 원천이 바뀌지 않았다면 감사로그가 늘면 안 됩니다. 바뀐 게 없으니 기록할 것도 없기 때문입니다. 이렇게 여러 번 실행해도 결과가 같은 성질을 **멱등성**이라고 합니다.

### 6. 처음 데이터는 "시드", 정답은 "정답표"

실습용 가짜 데이터(학생 11명, 2026년 3~8월, 대학 계정 거래 등)는 **시드 데이터**로 이미 만들어져 있습니다 (`docs/starter/seed.ts`). 학생마다 확인할 상황이 정해져 있습니다. 예를 들어 S03은 5월에 휴학하고, S06은 6월에 지원기간이 끝납니다. 이 데이터로 구현했을 때 나와야 하는 결과는 [요구사항 9장 정답표](docs/요구사항.md#9-인수-시나리오-테스트-데이터)에 숫자로 적혀 있습니다. **정답표와 같게 나오면 맞게 구현한 것입니다.**

### 7. 한 장으로 보기

```
  Mock 원천 (src_ 테이블)            연동 (Job)                  본 시스템
  ───────────────────────            ──────────                  ─────────
  학사 시스템          ── 학적 연동 JOB-ACAD ──▶  명부 ──(판정)──▶ 지원요건 O/X, 기준금액
  지급 시스템          ── 지급 연동 JOB-PAY ───▶  지급내역 ──(계산)──▶ 총지급액, 부족금액
  회계 시스템          ── 기관계정 연동 JOB-ACCT ▶  기관계정 원장 ──▶ 수입·지급·잔액

  정합성 검증 (CHK-01~08): 본 시스템에 복사해 둔 값 ↔ 원천의 현재 값 비교
  감사로그: 본 시스템 데이터의 모든 변경 기록      알림: 학적·요건 변화, 연동 오류
```

### 8. 문서에 나오는 번호 읽는 법

| 표기 | 뜻 | 예 |
|---|---|---|
| Step 6 | 이 README의 진행 단계 | |
| `SFR-001` | 기능 요구사항 묶음 번호 (원본 RFP 번호). 001 명부 / 002 지급 / 003 기관계정 / 004 추가기능 | |
| `001-04` | SFR-001의 4번째 세부 요구사항 | 월별 지원요건 O/X |
| `NFR-01` | 기능 외 요구사항 (실행 환경, 테스트, 보안) | |
| `SCR-02` | 화면 번호 | 학생연구자 명부 화면 |
| `CHK-05` | 정합성 검증 번호 | 지급내역이 원천과 맞는가 |
| `S01` | 시드 데이터의 학생 시나리오 번호 | 김민준 (박사, 정상 케이스) |
| P1 / P2 / P3 | 우선순위: 필수 / 권장 / 선택 | |
| `[가정]` | 원본 RFP에 없어서 이 프로젝트에서 정한 값 | 기준금액 |

---

## Step 1 — 개발 환경 설치

**목표**: Node.js, Git, VS Code가 설치되어 있다.

### 할 일

| 도구 | 버전 | 설치 방법 |
|---|---|---|
| Node.js | **24.x (LTS)** | [nodejs.org](https://nodejs.org)에서 "LTS" 버전 설치. 24.x가 아니면 [이전 버전 페이지](https://nodejs.org/en/download/archive)에서 24.x를 고른다 |
| Git | 최신 | macOS: 터미널에서 `xcode-select --install` / Windows: [git-scm.com](https://git-scm.com) 설치 (Git Bash 포함) |
| VS Code | 최신 | [code.visualstudio.com](https://code.visualstudio.com) |
| GitHub 계정 | — | 없으면 가입 (Step 15에서 사용) |

**Windows 사용자**: 이 문서의 모든 명령은 **Git Bash**에서 실행합니다 (PowerShell이나 cmd 말고). VS Code에서는 터미널 패널의 `+` 옆 화살표 → **Git Bash**를 선택합니다.

**VS Code 확장** (Extensions 탭에서 검색해 설치): ESLint, Tailwind CSS IntelliSense, Prettier

> DB 서버(Oracle, MySQL 등)는 **설치하지 않습니다.** 이 프로젝트는 DB를 파일 하나(SQLite)로 씁니다.

### 완료 확인

터미널에서 실행합니다.

```bash
node -v        # v24.로 시작해야 함
npm -v         # 11.x 등 숫자가 나오면 됨
git --version  # git version 2.x
```

- [ ] `node -v`가 `v24.`로 시작한다
- [ ] `git --version`이 나온다
- [ ] VS Code가 열린다

---

## Step 2 — 프로젝트 폴더 준비

**목표**: 전달받은 폴더를 작업 위치에 두었고, 요구사항 문서를 읽었다.

### 할 일

1. 받은 zip 파일을 풀고, 폴더를 **경로에 한글이나 공백이 없는 위치**로 옮기면서 이름을 `stipend-mentoring`으로 바꿉니다. 일부 도구가 한글 경로에서 오류를 내기 때문입니다.

```bash
mkdir -p ~/dev
# 압축을 푼 폴더를 ~/dev/stipend-mentoring 으로 옮긴 뒤
cd ~/dev/stipend-mentoring
ls            # README.md 와 docs 가 보여야 함
code .        # VS Code로 열기 (안 되면 VS Code에서 File → Open Folder)
```

2. **요구사항 문서를 읽습니다.** 이 Step에서 가장 중요한 일입니다.
   - [docs/요구사항.md](docs/요구사항.md) 1~3장: 꼼꼼히 읽기
   - 4~7장: 훑어보기 (각 Step에서 다시 읽음)
   - 9장: 시나리오 표만 훑어보기

### 완료 확인

- [ ] `~/dev/stipend-mentoring` 폴더에 `README.md`와 `docs/`가 있다
- [ ] 아래 질문에 문서를 보지 않고 답할 수 있다
  - 지원요건 R1~R4는 각각 무엇을 보는가?
  - 석사 학생이 2026-03 기준 누적지원개월 20이면 최대 지원가능 기한은? (정답: 2026-06)
  - 지원요건이 X인 달의 기준금액과 부족금액은 어떻게 표시하는가? (정답: `-`)
  - 미지급 월의 지급액은 어떻게 표시하는가? (정답: `0`)

---

## Step 3 — 프로젝트 생성

**목표**: `web/` 폴더에 Next.js 프로젝트가 있고, DB·시드·테스트가 동작하며, Git 첫 커밋이 되어 있다.

**먼저 읽기**: [A. 시스템 명세](#a-시스템-명세)의 구성도와 기술 스택, [E. Git 사용 방법](#e-git-사용-방법)

### 3-1. Git 시작

프로젝트 폴더(`stipend-mentoring/`)에서 실행합니다. Git이 이 폴더의 변경 이력을 기록하기 시작합니다.

```bash
git init -b main
printf ".DS_Store\nThumbs.db\n" > .gitignore
```

Git에 이름과 이메일이 설정되어 있지 않다면 먼저 설정합니다 (처음 한 번만).

```bash
git config --global user.name "홍길동"
git config --global user.email "GitHub에 가입한 이메일"
```

### 3-2. Next.js 프로젝트 생성

프로젝트 폴더(`stipend-mentoring/`)에서 실행합니다. 1~2분 걸립니다.

```bash
npx create-next-app@16.4.3 web --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm --disable-git --yes
cd web
```

### 3-3. 패키지 설치

`web/`에서 실행합니다. **두 줄 모두 버전까지 그대로** 입력합니다.

```bash
npm i --save-exact drizzle-orm@0.45.4 @libsql/client@0.18.0
npm i -D --save-exact @types/node@24.19.2 drizzle-kit@0.31.11 vitest@5.0.5 tsx@4.23.15 dotenv@18.0.9
```

| 패키지 | 용도 |
|---|---|
| `drizzle-orm` | DB를 TypeScript로 다루는 도구(ORM). SQL과 문법이 비슷함 |
| `@libsql/client` | SQLite 연결 드라이버. 로컬 파일과 Turso(배포용 클라우드 DB)를 같은 코드로 연결 |
| `drizzle-kit` | 스키마를 DB에 반영(`push`)하고, 브라우저로 DB를 보는 도구(`studio`) 제공 |
| `vitest` | 테스트 실행 |
| `tsx` | TypeScript 파일을 바로 실행 (시드 스크립트용) |
| `dotenv` | `.env` 파일의 환경변수 읽기. `dotenv run` 명령도 제공 |
| `@types/node` | Node.js 타입 정의 |

> **주의**: `@types/node@24.19.2`를 같은 줄에서 함께 설치해야 합니다. 빠뜨리면 create-next-app이 넣은 `@types/node@20`과 vitest가 충돌해 `ERESOLVE` 오류가 납니다.
>
> **주의**: `dotenv-cli` 패키지는 설치하지 않습니다. `dotenv` 18 버전에 같은 이름의 명령이 들어 있어 충돌합니다.

### 3-4. Next.js 설정 두 곳 수정

**① `web/next.config.ts`** — 아래 두 줄을 **삭제**합니다.

```ts
  cacheComponents: true,
  partialPrefetching: true,
```

**② `web/src/app/layout.tsx`** — 세 군데를 고칩니다.

- import 문들 바로 아래에 한 줄 추가

```ts
export const dynamic = "force-dynamic";
```

- `metadata`의 `title`을 `"연구생활장려금 관리"`로, `description`을 `"이공계 연구생활장려금 관리시스템 (멘토링 실습)"`으로 변경
- `<html lang="en"` 을 `<html lang="ko"` 로 변경

> **왜 고치나**: 이 버전의 create-next-app은 `cacheComponents`(캐시 기반 렌더링)를 켠 상태로 프로젝트를 만듭니다. 이 상태에서는 DB를 조회하는 페이지가 `npm run build` 때 "uncached or runtime data during prerendering" 오류로 실패합니다. 이 시스템은 모든 화면이 **항상 최신 DB 값**을 보여야 하는 업무 시스템이므로, 캐시 기능을 끄고 모든 페이지를 요청할 때마다 새로 그리도록(`force-dynamic`) 설정합니다.

### 3-5. 시작 파일 복사

`web/`에서 실행합니다. `docs/starter/`에는 검증된 스키마, 시드, 설정 파일이 들어 있습니다.

```bash
mkdir -p src/db src/domain src/lib src/jobs
cp ../docs/starter/schema.ts ../docs/starter/seed.ts ../docs/starter/client.ts src/db/
cp ../docs/starter/month.ts ../docs/starter/month.test.ts src/domain/
cp ../docs/starter/audit.ts src/lib/
cp ../docs/starter/setup.int.test.ts src/jobs/
cp ../docs/starter/drizzle.config.ts ../docs/starter/vitest.config.mts .
cp ../docs/starter/env.example .env.example
cp .env.example .env
printf 'DATABASE_URL=file:test.db\n' > .env.test
```

| 복사한 파일 | 내용 |
|---|---|
| `src/db/schema.ts` | 모든 테이블 정의. 각 컬럼의 의미가 주석으로 적혀 있음 |
| `src/db/seed.ts` | 요구사항 9장 시나리오 데이터 |
| `src/db/client.ts` | DB 연결 객체 `db` |
| `src/domain/month.ts`, `month.test.ts` | 기준월 계산 함수 `addMonths`와 그 테스트 (테스트 작성 예시) |
| `src/lib/audit.ts` | 감사로그 기록 함수 `recordAudit`와 트랜잭션 타입 `Tx` |
| `src/jobs/setup.int.test.ts` | 통합 테스트 환경이 동작하는지 확인하는 테스트 |
| `drizzle.config.ts` | drizzle-kit 설정 |
| `vitest.config.mts` | 테스트 설정. 테스트는 `test.db`를 쓰도록 되어 있음 |
| `.env` | 로컬 환경변수 (`DATABASE_URL=file:local.db`) |
| `.env.test` | 테스트 환경변수 (`DATABASE_URL=file:test.db`) |

### 3-6. .gitignore 수정

`web/.gitignore` 맨 아래에 추가합니다.

```gitignore
# SQLite DB 파일
*.db
*.db-*

# 커밋해도 되는 env 파일 (비밀정보 없음)
!.env.example
!.env.test
```

create-next-app의 기본 설정이 `.env*`를 모두 무시하기 때문에, 비밀정보가 없는 두 파일만 예외로 둡니다. `.env`는 계속 커밋되지 않습니다.

### 3-7. npm 스크립트 추가

`web/`에서 실행합니다.

```bash
npm pkg set \
  scripts.db:push="drizzle-kit push" \
  scripts.db:seed="tsx src/db/seed.ts" \
  scripts.db:reset="drizzle-kit push --force && tsx src/db/seed.ts" \
  scripts.db:studio="drizzle-kit studio" \
  scripts.test:prepare="dotenv run -q -f .env.test -- drizzle-kit push --force" \
  scripts.test="npm run test:prepare && vitest run" \
  scripts.test:watch="npm run test:prepare && vitest"
```

이후 자주 쓰는 명령입니다.

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 실행 → http://localhost:3000 |
| `npm run db:reset` | 스키마를 DB에 반영하고 시드를 다시 넣음. **DB가 꼬였을 때 언제든 실행** |
| `npm run db:studio` | 브라우저에서 DB 테이블을 보고 편집 (https://local.drizzle.studio) |
| `npm test` | 테스트 실행 (test.db 사용, 개발용 DB는 건드리지 않음) |
| `npm run build` | 배포용 빌드. 커밋 전에 실행해 오류가 없는지 확인 |

### 3-8. AI 규칙 파일 만들기

AI 코딩 도구를 쓰지 않더라도 만들어 둡니다. **프로젝트 폴더 최상위**(`stipend-mentoring/`)에 두 파일을 만듭니다.

- `AGENTS.md`: [D-2](#d-2-규칙-파일)의 내용을 그대로 붙여 넣습니다.
- `CLAUDE.md`: 아래 한 줄만 넣습니다. Claude Code가 `AGENTS.md`를 읽게 하는 설정입니다.

```markdown
@AGENTS.md
```

> `web/AGENTS.md`는 create-next-app이 자동으로 만든 파일입니다. Next.js 문서 위치를 알려 주는 내용이며, 지우지 말고 그대로 커밋합니다.

### 3-9. 실행해 보기

```bash
npm run db:reset    # 마지막 줄에 "시드 완료"
npm test            # Test Files 2 passed, Tests 3 passed
npm run dev         # http://localhost:3000 에 Next.js 기본 화면
```

`npm run dev`는 `Ctrl+C`로 끕니다. 이어서 DB를 확인합니다.

```bash
npm run db:studio   # https://local.drizzle.studio 를 브라우저로 열기
```

왼쪽 테이블 목록에서 `src_academic_monthly`를 열면 66행이 보여야 합니다.

### 3-10. 첫 커밋

프로젝트 폴더(`stipend-mentoring/`)에서 실행합니다.

```bash
cd ..
git add .
git status          # web/local.db, web/test.db, web/.env 가 목록에 없어야 함
git commit -m "chore: Next.js 프로젝트 생성, DB·테스트 환경 구성"
git log --oneline   # 커밋 1개가 보이면 성공
```

### 완료 확인

- [ ] `npm run db:reset` → "시드 완료"
- [ ] `npm test` → 2 files, 3 tests 통과
- [ ] `npm run build` → 오류 없이 끝남
- [ ] Drizzle Studio에서 `src_academic_monthly` 66행, `src_payment` 87행, `rule_config` 11행이 보인다
- [ ] `git status`에 `.db` 파일과 `.env`가 나오지 않는다
- [ ] `git log --oneline`에 첫 커밋이 보인다

---

## Step 4 — 공통 기반

**목표**: 모든 화면이 함께 쓰는 코드표, 규칙 설정 읽기, 표시 형식 함수, 화면 레이아웃(메뉴)이 준비되어 있다.

**먼저 읽기**: 요구사항 2.3(공통 표시 규칙), 3.3·3.4(코드), [A-6 코드 규칙](#a-6-코드-규칙), [B-1](#b-1-공통-lib)

### 할 일

1. **`src/lib/codes.ts`** — 요구사항 3.1·3.3·3.4의 코드를 상수로 정의합니다. 코드 목록은 DB가 아니라 코드에 둡니다 (업무 규칙의 *숫자*가 아니므로 [A-6](#a-6-코드-규칙)의 규칙 1에 해당하지 않음). 형태는 [B-1](#b-1-공통-lib)을 따릅니다.
2. **`src/lib/rules.ts`** — `rule_config` 테이블을 읽어 `Rules` 객체로 바꾸는 `loadRules()`를 만듭니다. 키와 필드의 대응은 [B-1](#b-1-공통-lib)에 있습니다. 키가 없거나 숫자가 아니면 오류를 던집니다.
3. **`src/lib/format.ts`** — `formatWon`, `formatOX`, `maskResearcherNo`를 만들고 `src/lib/format.test.ts`에 테스트를 작성합니다.
4. **`src/components/Badge.tsx`** — 정합성 결과 배지. `ok`이면 초록색 "일치", 아니면 빨간색 "불일치". 불일치일 때 클릭하면 차이 내역(`diffs`)을 펼쳐 보여 줍니다 (`<details>`/`<summary>` 태그를 쓰면 클라이언트 코드 없이 됩니다).
5. **`src/app/layout.tsx`** — `<body>` 안에 왼쪽 메뉴와 본문 영역을 만듭니다. 메뉴 항목은 [A-5 화면 경로](#a-5-화면-경로)의 P1 화면입니다 (명부, 지도교수별, 지급내역, 기관계정, 연동관리, 감사로그, Mock 원천). 아직 없는 화면은 클릭하면 404가 나와도 됩니다.
6. **`src/app/page.tsx`** — create-next-app 기본 내용을 지우고 "연구생활장려금 관리시스템" 제목과 각 화면으로 가는 링크만 둡니다 (대시보드는 Step 12에서 만듦).

### 완료 확인

- [ ] `formatWon(1200000)` → `"1,200,000"`, `formatWon(0)` → `"0"`, `formatWon(null)` → `"-"`
- [ ] `maskResearcherNo("20000001")` → `"2000****"`
- [ ] `loadRules()`로 읽은 `maxMonths.석사`가 `24`이다 (테스트로 확인, 통합 테스트이므로 `beforeEach`에서 `seedAll()` 호출)
- [ ] `npm run dev`에서 왼쪽 메뉴가 보인다
- [ ] `npm test`, `npm run build` 통과 → 커밋

---

## Step 5 — 판정 엔진

**목표**: 지원요건 판정(R1~R4), 최대 지원가능 기한, 기준금액, 부족금액, 학기 계산이 **DB 없이** 동작하고 테스트로 검증되어 있다.

**먼저 읽기**: 요구사항 2.2(학기), 3.1(지원요건), 3.2(기준금액), 9.3(정답표), [B-2](#b-2-판정-엔진-domain)

이 Step이 프로젝트에서 가장 중요합니다. 이후 모든 화면이 이 함수들의 결과를 보여 줍니다.

### 할 일

1. **`src/domain/month.ts`**에 `termOf`, `termMonths`, `previousYmKst`를 추가합니다.
2. **`src/domain/eligibility.ts`**에 `countCumSupportMonths`, `judge`를 만듭니다.
3. **`src/domain/amount.ts`**에 `meetsStandard`, `shortage`를 만듭니다.
4. 각 파일 옆에 `*.test.ts`를 만들고 아래 테스트 케이스를 **모두** 작성합니다. 테스트용 `Rules` 객체는 시드 값과 같게 테스트 파일 안에 직접 만듭니다 (DB를 쓰지 않기 위해).

**필수 테스트 케이스** — `judge`

| 케이스 | 입력 | 기대 결과 |
|---|---|---|
| S01 정상 | 박사, 재학, Y, RND, 학기 5, 누적 24, 2026-03 | r1~r4 모두 O, 종합 O, 기한 `2028-02`, 기준금액 1,100,000 |
| S03 휴학 | 석사, 휴학, Y, NONE, 학기 3, 누적 14, 2026-05 | r1 X, r2 O, r3 X, r4 O, 종합 X, 기한 `2027-02`, 기준금액 `null` |
| S04 비전일제 | 박사, 재학, N, RND, 학기 5, 누적 24, 2026-03 | r2만 X, 종합 X, 기준금액 `null` |
| S05 통합 4학기 | 석박통합, 재학, Y, LAB, 학기 4, 누적 18, 2026-03 | 종합 O, 기한 `2030-08`, 기준금액 800,000 |
| S11 통합 5학기 | 석박통합, 재학, Y, RND, 학기 5, 누적 24, 2026-03 | 종합 O, 기준금액 1,100,000 |
| S06 기한 마지막 달 | 석사, 재학, Y, RND, 학기 4, 누적 23, 2026-05 | r4 O, 기한 `2026-05` |
| S06 기한 만료 | 석사, 재학, Y, RND, 학기 4, 누적 24, 2026-06 | r4 X, 종합 X, 기한 `null` |
| 요구사항 예시 | 석사, 재학, Y, RND, 누적 20, 2026-03 | 기한 `2026-06` |

**필수 테스트 케이스** — 나머지

| 함수 | 입력 | 기대 결과 |
|---|---|---|
| `countCumSupportMonths` | S06 이력(2024-06~2026-02 RND 21개월 + 2026-03 RND), 기준월 2026-04 | 22 |
| `countCumSupportMonths` | 기준월과 같은 달의 이력 | 세지 않음 |
| `countCumSupportMonths` | 활동유형 `NONE`인 달 | 세지 않음 |
| `shortage` | (800000, 500000) | 300000 |
| `shortage` | (1100000, 1200000) | 0 |
| `shortage` | (null, 700000) | null |
| `meetsStandard` | (1100000, 0) | `'X'` |
| `termOf` | `'2026-03'` / `'2026-09'` / `'2027-02'` | `'2026-1'` / `'2026-2'` / `'2026-2'` |
| `termMonths` | `'2026-2'` | `['2026-09', … , '2027-02']` (6개) |
| `previousYmKst` | `2026-11-01T00:00:00Z` (한국 11-01 09:00) | `'2026-10'` |
| `previousYmKst` | `2026-10-31T16:00:00Z` (한국 11-01 01:00) | `'2026-10'` |
| `previousYmKst` | `2026-10-31T14:00:00Z` (한국 10-31 23:00) | `'2026-09'` |

### 완료 확인

- [ ] 위 표의 테스트가 모두 있고 통과한다
- [ ] `src/domain/` 안의 어떤 파일도 `@/db`를 import하지 않는다
- [ ] 기준금액·최대지원개월 같은 숫자가 `src/domain/` 코드에 직접 쓰여 있지 않다 (모두 `rules`에서 읽음)
- [ ] `npm test`, `npm run build` 통과 → 커밋

---

## Step 6 — 연동 골격과 학적 연동 (JOB-ACAD)

**목표**: 연동관리 화면에서 학적 연동(JOB-ACAD)을 실행하면, 학적 원천(`src_academic_monthly`)의 데이터가 명부(`student_monthly`)로 복사되고 지원요건 판정 결과(`eligibility_result`)가 채워진다. 실행 이력·감사로그·알림도 남는다.

이 Step에서 만드는 `runJob()`은 세 연동이 함께 쓰는 공통 틀입니다. 실행 기록 남기기, 오류 모으기, 결과 상태 정하기를 한곳에서 처리하고, 각 연동은 "무엇을 읽어서 어디에 쓸지"만 구현합니다.

**먼저 읽기**: 요구사항 4장 전체, 9.5, [B-3](#b-3-감사로그-알림-연동-실행), [C. 연동 Job 처리 절차](#c-연동-job-처리-절차)

### 할 일

1. **`src/lib/notify.ts`** — `createNotification(tx, {...})`
2. **`src/jobs/run.ts`** — `runJob()`: 실행 이력 기록, 트랜잭션, 오류 수집, 결과 상태 결정, `SYNC_ALERT` 알림을 공통으로 처리합니다. 처리 순서는 [C-1](#c-1-공통-runjob)에 있습니다.
3. **`src/jobs/acad.ts`** — `runAcadJob(baseYm, trigger)`. 처리 순서는 [C-2](#c-2-job-acad)에 있습니다.
4. **`src/app/sync/page.tsx`, `src/app/sync/actions.ts`** — 연동관리 화면(SCR-10)의 실행 영역과 실행 이력 표. 화면 구성은 요구사항 7.1의 SCR-10을 따릅니다. 폼과 Server Action을 연결하는 방법은 [A-7 화면 코드 패턴](#a-7-화면-코드-패턴)에 있습니다. 이 Step에서는 Job 선택지에 JOB-ACAD만 있어도 됩니다.
5. **`src/jobs/acad.int.test.ts`** — 통합 테스트. `beforeEach`에서 `seedAll()`을 호출합니다.

**필수 통합 테스트 케이스**

| 케이스 | 기대 결과 |
|---|---|
| 2026-03 실행 | SUCCESS, 읽음 11 / 성공 11 / 오류 0. `student_monthly` 11행, `eligibility_result` 11행 |
| 2026-03 실행 후 판정 | S01 종합 O, S04 종합 X, S06 `max_support_ym`이 `2026-05` |
| 03~08 순서대로 실행 | 알림 5건 (요구사항 9.5의 JOB-ACAD 알림과 같은 유형·학생) |
| 03을 두 번 실행 | 두 번째 실행에서 감사로그 증가 0, 알림 증가 0 |
| 원천 학위과정을 `학사`로 바꾸고 실행 | PARTIAL, 오류 1건 `E_CODE`, 해당 학생의 명부 행 없음 |
| 원천 학과를 바꾸고 다시 실행 | 해당 행 감사로그 `U` 1건, `before_json`과 `after_json`의 `dept`가 다름 |

### 완료 확인

- [ ] 위 통합 테스트가 모두 통과한다
- [ ] `npm run dev` → `/sync`에서 2026-03 JOB-ACAD를 실행하면 실행 이력에 SUCCESS 11/11/0이 나온다
- [ ] Drizzle Studio에서 `audit_log`에 `actor`가 `SYSTEM:JOB-ACAD`인 행이 보인다
- [ ] `npm test`, `npm run build` 통과 → 커밋

---

## Step 7 — 지급 연동, 기관계정 연동, 자동 연동 API

**목표**: 지급 연동(`JOB-PAY`)과 기관계정 연동(`JOB-ACCT`)까지 세 연동이 모두 동작하고, 연동 오류 내역을 화면에서 볼 수 있으며, 스케줄러가 매월 호출할 자동 연동 API(`/api/cron/sync`)가 준비되어 있다.

**먼저 읽기**: 요구사항 4.2의 Job별 검증 항목, 9.2의 S10 오류 행, 9.5, [C-3](#c-3-job-pay), [C-4](#c-4-job-acct), [C-5](#c-5-cron-라우트)

### 할 일

1. **`src/jobs/pay.ts`** — `runPayJob(baseYm, trigger)`
2. **`src/jobs/acct.ts`** — `runAcctJob(from, to, trigger)`. 대상 문자열은 `'2026-01-01~2026-06-30'` 형식입니다.
3. **연동관리 화면 보완** — Job 선택지에 세 Job 모두 추가. JOB-ACCT를 고르면 기준월 대신 시작일·종료일을 입력합니다. 실행 이력 행을 클릭하면 오류 내역을 보여 줍니다 (`/sync?syncId=3`처럼 쿼리 파라미터로 선택한 이력을 표시).
4. **`src/domain/month.ts`에 `lastDayOf` 추가** — [C-5](#c-5-cron-라우트)의 테스트 표대로 테스트를 함께 작성합니다.
5. **`src/app/api/cron/sync/route.ts`** — [C-5](#c-5-cron-라우트)대로 만듭니다.
6. **통합 테스트** `src/jobs/pay.int.test.ts`, `src/jobs/acct.int.test.ts`

**필수 통합 테스트 케이스**

| 케이스 | 기대 결과 |
|---|---|
| ACAD 03 → PAY 03 | PARTIAL, 읽음 17 / 성공 15 / 오류 2. 오류는 `PAY-ERR-1` `E_REQUIRED`, `PAY-ERR-2` `E_CODE`. `SYNC_ALERT` 알림 1건 |
| ACAD 04 → PAY 04 | SUCCESS, 14 / 14 / 0. S08의 04월 `payment` 행 없음 |
| ACAD 없이 PAY 03 | PARTIAL, 읽음 17 / 성공 0 / 오류 17. 정상 형식 15행은 `E_REF`, `PAY-ERR-1`은 `E_REQUIRED`, `PAY-ERR-2`는 `E_CODE` (검사 순서상 `E_REF`보다 먼저 걸림) |
| PAY 03 두 번 실행 | 두 번째 실행에서 감사로그 증가 0 |
| 원천에서 지급 행 1건 삭제 후 PAY 03 | `payment`에서도 삭제, 감사로그 `D` 1건 |
| ACCT 2026-01-01~2026-06-30 | SUCCESS, 9 / 9 / 0 |
| ACCT 2026-03-01~2026-03-31 | SUCCESS, 5 / 5 / 0 (TXN-0002·0003·0004·0102·0103) |
| `lastDayOf` | C-5의 테스트 표 4건 |

> 마지막 ACCT 케이스는 시드 파일(`src/db/seed.ts`)의 `src_account_txn`에서 3월 거래를 직접 세어 보고 확인합니다.

### 완료 확인

- [ ] 위 통합 테스트가 모두 통과한다
- [ ] `/sync`에서 PAY 2026-03 실행 이력을 클릭하면 오류 2건이 보인다
- [ ] 개발 서버를 켠 상태에서 아래 명령이 `401`을 돌려준다 (인증 헤더 없음)

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/cron/sync
```

- [ ] 아래 명령은 `200`을 돌려주고 `/sync`에 실행 방식이 `SCHEDULE`인 이력 3건이 생긴다

```bash
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer local-dev-secret" http://localhost:3000/api/cron/sync
```

- [ ] `npm test`, `npm run build` 통과 → 커밋

---

## Step 8 — 학생연구자 명부 화면

**목표**: SCR-02(명부), SCR-03(학생 상세), SCR-04(지도교수별 집계 — 명부)가 동작하고 CHK-01~03이 표시된다.

**먼저 읽기**: 요구사항 SFR-001, 5장(CHK-01~03 세부 기준), 7.1의 SCR-02, 9.3·9.4, [B-4](#b-4-정합성-검증과-조회-쿼리), [A-7](#a-7-화면-코드-패턴)

### 할 일

1. **`src/domain/checks.ts`** — `diffFields()`와 테스트
2. **`src/queries/roster.ts`** — 명부 조회 쿼리 (필터 포함), CHK-01~03 계산
3. **`src/app/roster/page.tsx`** — SCR-02. 조회 조건은 URL 쿼리(`?ym=2026-03&degree=석사`)로 받습니다. 필터 폼은 `method="get"`인 일반 `<form>`으로 만듭니다.
4. **`src/app/students/[studentNo]/page.tsx`** — SCR-03. 이 Step에서는 "학적"과 "요건" 탭만 만들고, "지급"·"변경이력" 탭은 Step 9·11에서 채웁니다. 탭은 `?tab=` 쿼리로 구분합니다.
5. **`src/app/professors/page.tsx`** — SCR-04 (명부 집계). 교수 이름을 클릭하면 `/roster?ym=…&advisor=P01`로 이동합니다.

### 완료 확인

연동을 먼저 실행합니다: `npm run db:reset` 후 `/sync`에서 JOB-ACAD를 03~08 순서로 실행.

- [ ] `/roster?ym=2026-03`에 11명이 나오고, 각 학생의 R1~R4·종합·기한이 요구사항 9.3과 같다
- [ ] `/roster?ym=2026-06`에서 S06(강하은)이 `OOOX`, 종합 X, `기한 만료`
- [ ] 필터로 종합 X만 고르면 2026-03에 S04 1명만 나온다
- [ ] CHK-01~03이 모두 "일치"이다
- [ ] Drizzle Studio에서 `src_academic_monthly`의 2026-03 S07 `dept`를 `소프트웨어학과`로 바꾸면, 새로고침 시 S07의 CHK-01이 "불일치"이고 펼치면 학과의 양쪽 값이 보인다. JOB-ACAD 03을 다시 실행하면 "일치"로 돌아온다
- [ ] `/professors?ym=2026-03`이 요구사항 9.4 표의 참여학생·요건 O·요건 X와 같다
- [ ] `npm test`, `npm run build` 통과 → 커밋

---

## Step 9 — 지급내역 화면

**목표**: SCR-06(지급내역)과 SCR-04의 지급 집계가 동작하고 CHK-04·05가 표시된다.

**먼저 읽기**: 요구사항 SFR-002, 5장(CHK-04·05), 7.1의 SCR-06, 9.3·9.4·9.6

### 할 일

1. **`src/queries/payments.ts`** — 학생×재원 금액표. 지급내역이 없는 재원은 `0`이 되도록 SQL에서 처리합니다 (`COALESCE`, 또는 재원별 `SUM(CASE WHEN fund_code = 'F11' THEN amount ELSE 0 END)`).
2. **`src/app/payments/page.tsx`** — SCR-06. 열 구성은 요구사항 7.1을 따르고, 맨 아래 합계 행을 둡니다.
3. **SCR-04 보완** — `?view=payment`일 때 지급 집계(학생 수, 총지급액, 부족 학생 수, 부족금액 합계)를 보여 줍니다.
4. **SCR-03 보완** — "지급" 탭에 해당 학생의 월별 재원 금액을 보여 줍니다 (기준월 6개월을 행으로).

### 완료 확인

연동을 먼저 실행합니다: JOB-ACAD 03~08, JOB-PAY 03~08.

- [ ] `/payments?ym=2026-03` 합계 행의 총지급액이 9,700,000
- [ ] S02 부족금액 300,000, S04 기준금액·충족·부족이 모두 `-`
- [ ] `/payments?ym=2026-04`에서 S08의 모든 재원이 `0`, 부족금액 1,100,000
- [ ] S05 기준금액 800,000, S11 기준금액 1,100,000
- [ ] 2026-03 S10의 CHK-05가 "불일치"(원천에만 F99 50,000), 나머지 학생은 "일치"
- [ ] `src_payment`에서 2026-03 S09 F12 금액을 `700000`으로 바꾸면 CHK-05 "불일치" → JOB-PAY 03 재실행 후 "일치", 부족금액 100,000
- [ ] `/professors?ym=2026-03&view=payment`가 요구사항 9.4와 같다
- [ ] `npm test`, `npm run build` 통과 → 커밋

---

## Step 10 — 기관계정 원장 화면

**목표**: SCR-08(기관계정 원장)이 동작하고 CHK-06~08이 표시된다.

**먼저 읽기**: 요구사항 SFR-003, 3.4, 5장(CHK-06~08 세부 기준), 7.1의 SCR-08, 9.4의 기관계정 표

### 할 일

1. **`src/queries/ledger.ts`**
   - 원장 조회: 출처별 누적잔액은 SQL 윈도우 함수로 계산합니다 ([A-7](#a-7-화면-코드-패턴)의 예시 쿼리 참고).
   - 기간 조회의 기초잔액: 시작일 **전날까지**의 출처별 (수입 − 지급)
   - 요약: 수입총액 구성(전년도 잔액 / 대상연도 수입 / 이자), 지급총액, 잔액총액
   - CHK-06~08 계산 (보고 기준일까지의 누적으로 비교)
2. **`src/app/accounts/[accountId]/page.tsx`** — SCR-08. 메뉴의 "기관계정"은 `/accounts/A01`로 연결합니다.

### 완료 확인

연동을 먼저 실행합니다: JOB-ACCT 2026-01-01~2026-06-30.

- [ ] `/accounts/A01` 요약: 수입총액 45,120,000 (5,000,000 / 40,000,000 / 120,000), 지급총액 12,000,000, 잔액 33,120,000
- [ ] I_GOV 누적잔액이 30,000,000 → 24,000,000 → 18,000,000
- [ ] `?from=2026-04-01&to=2026-06-30`으로 조회하면 기초잔액 행에 I_GOV 24,000,000이 나온다
- [ ] 정렬을 내림차순으로 바꿀 수 있다
- [ ] CHK-06~08이 모두 "일치"
- [ ] `src_account_summary`의 A01 I_GOV `balance`를 `17999999`로 바꾸면 CHK-07(I_GOV)과 CHK-08이 "불일치", CHK-06은 "일치"
- [ ] `npm test`, `npm run build` 통과 → 커밋

---

## Step 11 — 감사로그와 Mock 원천 편집 화면

**목표**: SCR-11(감사로그), SCR-13(Mock 원천 편집)이 동작하고, **P1 기능이 모두 완성**되어 있다.

**먼저 읽기**: 요구사항 SFR-001-09, 002-15, 003-10, 7장의 SCR-11·SCR-13

### 할 일

1. **`src/app/audit/page.tsx`** — SCR-11. 필터: 대상 테이블, 기간(`acted_at` 날짜), 작업자. 최근 순. 행을 펼치면 `before_json`과 `after_json`을 나란히 보여 주고, 바뀐 필드를 강조합니다.
2. **SCR-03 보완** — "변경 이력" 탭: 해당 학생의 `student_monthly`, `eligibility_result`, `payment` 감사로그 (`row_key`에 학번이 들어간 행).
3. **`src/app/mock-source/page.tsx`** — SCR-13. 최소 범위는 `src_academic_monthly`와 `src_payment`의 **목록 + 한 행 수정**입니다. 수정 폼은 Server Action으로 저장합니다. `src_` 테이블 수정은 감사로그를 남기지 않습니다 (원천 시스템이므로).
   - 시간이 부족하면 이 화면을 만들지 않고 Drizzle Studio로 대신해도 됩니다 (요구사항 7장 참고). 이 경우 메뉴에서 SCR-13을 빼고 README에 적어 둡니다.
4. **지급계획 쓰기 경로 점검** — Step 12의 지급계획(SCR-07)을 하지 않더라도, 앞으로 추가하는 모든 쓰기가 `recordAudit`을 거치는지 [A-6](#a-6-코드-규칙)의 규칙 3을 다시 확인합니다.

### 완료 확인

- [ ] Step 8~10에서 했던 원천 변경 실습을 SCR-13(또는 Drizzle Studio)으로 다시 해 보고, 감사로그 화면에서 `U` 기록을 찾을 수 있다
- [ ] 요구사항 6장의 **P1 항목**을 하나씩 열어 완료 기준을 모두 만족하는지 확인했다
- [ ] `npm test`, `npm run build` 통과 → 커밋. 커밋 메시지에 "P1 완료"를 남긴다

---

## Step 12 — P2 화면

**목표**: 요구사항의 P2 항목이 동작한다. 남은 기간을 보고 **위에서부터** 할 수 있는 만큼 합니다.

**먼저 읽기**: 요구사항 6장의 P2 항목, 7장

| 순서 | 화면·기능 | 요구사항 | 구현 메모 |
|---|---|---|---|
| 1 | SCR-12 알림함 + 상단 안 읽은 개수 | 004-02, 004-04 | 알림 클릭 시 `read_yn='Y'`로 바꾸고 `link`로 이동 (Server Action) |
| 2 | SCR-05 학기 단위 조회 | 001-10, 002-14 | `termMonths()`로 6개월을 구해 학생×월 매트릭스. 부족금액 합계 열: S02 1,800,000, S08 1,100,000 |
| 3 | SCR-09 정합성 점검 | 5장 | 기준월·계정을 고르면 CHK-01~08 결과를 한 표로. Step 8~10의 쿼리 재사용 |
| 4 | SCR-01 대시보드 | 004-01, 03, 07 | 세 탭을 `?tab=`으로 구분. 수치는 Step 8~10 쿼리 재사용 |
| 5 | 003-09 기관 세부계정 | 003-09 | `/accounts/A02`가 그대로 동작하는지 확인하고, 화면에 계정 선택 추가. A02 잔액 2,200,000 |
| 6 | SCR-07 지급 계획 vs 실지급 | 002-16 | `payment_plan` 입력 폼(Server Action + `recordAudit`, actor `admin`). 학생×재원별 계획·실지급·차이 |
| 7 | SCR-14 기준정보 | 3장 | `rule_config` 목록과 값 수정 (수정 시 감사로그). 코드표 조회 |
| 8 | 국가연구자번호 마스킹 | 2.3 | 목록 화면만 `maskResearcherNo()` 적용 |

### 완료 확인

- [ ] 구현한 항목마다 요구사항 6장의 완료 기준을 만족한다
- [ ] 구현하지 않은 P2 항목을 회고 문서에 적어 둔다

---

## Step 13 — 로그인과 권한 (P2)

**목표**: 로그인해야 화면을 볼 수 있고, 지도교수(`PROF`)는 자기 학생만 본다.

**먼저 읽기**: 요구사항 1.3, 8.3

외부 인증 라이브러리 없이 직접 구현합니다 (구조를 이해하기 위해서). `bcryptjs`만 추가로 설치합니다.

```bash
npm i --save-exact bcryptjs@3.0.2
```

> 위 버전이 설치되지 않으면 `npm view bcryptjs version`으로 최신 버전을 확인해 설치합니다. 이 Step은 시작 파일 검증 범위 밖입니다.

### 할 일

1. **시드에 사용자 추가** — `seed.ts`에 `app_user` 3명을 추가합니다: `admin`(ADMIN), `p01`(PROF, P01), `p02`(PROF, P02). 비밀번호는 모두 `pass1234`를 bcrypt 해시로 저장합니다. `app_user`는 `professor`를 참조하므로, **JOB-ACAD를 실행한 뒤**에야 넣을 수 있다는 점에 주의합니다 (시드에서 `professor`에 P01·P02를 직접 넣거나, `prof_id`를 비우고 로그인 시 확인하는 방식 중 선택하고 README에 기록).
2. **`src/lib/session.ts`** — 로그인 성공 시 `{ userId, role, profId }`를 JSON으로 만들고, `CRON_SECRET`과 별개인 `SESSION_SECRET` 환경변수로 HMAC 서명(`node:crypto`의 `createHmac('sha256', …)`)해 httpOnly 쿠키에 저장. 요청 때 서명을 검증해 세션을 꺼내는 `getSession()`을 제공합니다.
3. **`src/app/login/page.tsx`** — 아이디·비밀번호 폼, Server Action으로 검증
4. **`src/proxy.ts`** — 쿠키가 없으면 `/login`으로 보냅니다. Next.js 16에서는 `middleware.ts`의 이름이 `proxy.ts`로 바뀌었습니다. 작성 전에 `web/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`를 읽습니다. `/login`과 `/api/cron/sync`는 제외합니다.
5. **권한 적용** — `PROF`이면 명부·지급내역·지도교수별 화면의 쿼리에 `advisor_id = 내 profId` 조건을 강제로 붙입니다. 연동 실행, Mock 원천, 기준정보, 감사로그 화면은 `ADMIN`만 접근 가능.

### 완료 확인

- [ ] 로그인하지 않으면 모든 화면이 `/login`으로 이동한다 (Cron API는 제외)
- [ ] `p01`로 로그인하면 `/roster?ym=2026-03`에 6명만 보이고, `/sync`에 접근할 수 없다
- [ ] 비밀번호가 DB에 평문으로 저장되어 있지 않다
- [ ] `.env.example`에 `SESSION_SECRET=` 항목이 추가되어 있다

---

## Step 14 — 최종 테스트와 인수 점검

**목표**: 테스트가 충분하고, 요구사항 9장의 정답표를 화면에서 모두 확인했다.

### 할 일

1. 테스트 보강: [요구사항 8.2](docs/요구사항.md#82-테스트-원본-단위통합시스템인수)의 단위·통합 테스트 범위를 다시 확인하고, 빠진 CHK 로직 테스트를 추가합니다.
2. `npm run db:reset` 후 아래 **인수 체크리스트**를 처음부터 끝까지 화면에서 따라 합니다.

### 인수 체크리스트

**연동** (`/sync`)

- [ ] JOB-ACAD 03~08 순서대로 실행 → 모두 SUCCESS 11/11/0
- [ ] JOB-PAY 03 → PARTIAL 17/15/2, 오류 내역 2건
- [ ] JOB-PAY 04~08 → SUCCESS
- [ ] JOB-ACCT 2026-01-01~2026-06-30 → SUCCESS 9/9/0
- [ ] 알림 6건 (요구사항 9.5)
- [ ] 같은 Job을 한 번 더 실행해도 감사로그·알림이 늘지 않는다

**명부·지급** (요구사항 9.3·9.4 정답표와 비교)

- [ ] S01: 6개월 모두 O, 부족 0
- [ ] S02: 매월 부족 300,000 (학기 합계 1,800,000)
- [ ] S03: 3~4월 O, 5월부터 X (R1·R3), 휴학 중 기한이 한 달씩 늦춰짐
- [ ] S04: X (R2), 기준금액 `-`
- [ ] S05: 기준금액 800,000 / S11: 1,100,000
- [ ] S06: 기한 2026-05, 6월부터 `기한 만료`
- [ ] S08: 4월 모든 재원 `0`, 부족 1,100,000
- [ ] S10: 2026-03 CHK-05 불일치 (F99)
- [ ] 2026-03 지도교수별 집계와 총지급액 9,700,000

**기관계정**

- [ ] A01 수입 45,120,000 / 지급 12,000,000 / 잔액 33,120,000, CHK-06~08 일치

**원천 변경 실습** (요구사항 9.6 표 4개) — 끝나면 `npm run db:reset`

- [ ] S07 학과 변경 → CHK-01 불일치 → 재연동 → 일치, 감사로그 `U`
- [ ] S09 금액 변경 → CHK-05 불일치 → 재연동 → 일치
- [ ] A01 I_GOV 보고 잔액 변경 → CHK-07·08 불일치
- [ ] S01 학위과정 `학사` → JOB-ACAD PARTIAL, `E_CODE`

---

## Step 15 — GitHub에 올리고 호스팅해 보기

**목표**: 코드가 GitHub에 올라가 있고, Vercel에 배포를 시도해 **로컬에서 쓰던 SQLite 파일 DB가 호스팅 환경에서 왜 동작하지 않는지** 직접 확인하고 해결 방향을 정리했다.

> 이 Step은 시작 파일 검증 범위 밖입니다. GitHub·Vercel의 메뉴 이름은 바뀔 수 있으니, 다르면 비슷한 이름을 찾거나 공식 문서를 봅니다.

### 15-1. GitHub에 올리기

1. GitHub에 로그인하고 오른쪽 위 `+` → **New repository**를 누릅니다.
   - Repository name: `stipend-mentoring`
   - **Private** 선택 (원본 RFP 발췌문이 들어 있으므로)
   - "Add a README file" 등 초기화 옵션은 **모두 끕니다** (파일은 이미 내 컴퓨터에 있으므로)
2. 만든 뒤 나오는 주소로 프로젝트 폴더에서 실행합니다.

```bash
git remote add origin https://github.com/<내 계정>/stipend-mentoring.git
git push -u origin main
```

처음 push할 때 GitHub 로그인 창이 뜨면 브라우저로 인증합니다.

3. GitHub 저장소 페이지에서 `web/`, `docs/`, `README.md`가 보이고, `web/.env`와 `web/local.db`는 **없는지** 확인합니다.

### 15-2. Vercel에 배포하기

1. [vercel.com](https://vercel.com)에 **GitHub 계정으로** 가입합니다 (Hobby 무료 플랜).
2. **Add New → Project**에서 `stipend-mentoring` 저장소를 **Import**합니다.
3. **Root Directory**를 `web`으로 지정합니다. 빠뜨리면 빌드가 실패합니다.
4. **Environment Variables**에 로컬 `.env`와 같은 값을 넣습니다.

| 이름 | 값 |
|---|---|
| `DATABASE_URL` | `file:local.db` |
| `CRON_SECRET` | 임의의 긴 문자열 |
| `SESSION_SECRET` | Step 13을 했다면 임의의 긴 문자열 |

5. **Deploy**를 누릅니다. 2~3분 뒤 `https://stipend-mentoring-xxxx.vercel.app` 형태의 주소가 생깁니다.

### 15-3. 결과 확인 — 화면에서 오류가 나는 것이 정상입니다

- 빌드는 **성공**합니다. 모든 페이지가 `force-dynamic`이라 빌드할 때 DB에 접근하지 않기 때문입니다.
- 배포 주소에서 `/roster`처럼 DB를 쓰는 화면을 열면 **오류(500)** 가 납니다.
- Vercel 프로젝트의 **Logs**(또는 Deployments → 해당 배포 → Runtime Logs)에서 DB 관련 오류 메시지를 찾아 회고에 적습니다.

**왜 안 되나**

| 원인 | 설명 |
|---|---|
| DB 파일이 없다 | `local.db`는 `.gitignore`에 있어서 GitHub에 올라가지 않았고, Vercel은 GitHub의 코드만 가져간다 |
| 파일에 써도 남지 않는다 | Vercel은 **서버리스** 환경이다. 요청을 처리하는 실행 환경이 수시로 새로 만들어지고, 앱 폴더는 읽기 전용이다. DB 파일을 함께 올려도 연동·수정으로 쓴 데이터는 저장되지 않거나 곧 사라진다 |
| 실행 환경끼리 파일을 공유하지 않는다 | 요청이 몰리면 실행 환경이 여러 개 뜨고 각자 자기 파일을 본다. 한 곳에서 쓴 데이터가 다른 곳에서 보이지 않는다 |

즉, **DB를 앱과 같은 서버의 파일로 두는 방식은 서버리스 호스팅과 맞지 않습니다.** DB를 앱 밖의 별도 서비스로 분리해야 합니다.

### 15-4. 해결 방향 (조사만 하고 구현하지 않음)

이 프로젝트는 여기까지 합니다. 아래 방법을 읽어 보고, **어떤 방법을 고를지와 그 이유**를 회고에 적습니다.

| 방법 | 내용 | 코드 변경 |
|---|---|---|
| **Turso** (SQLite 호환 클라우드 DB) | Turso에서 DB를 만들고 `DATABASE_URL`을 `libsql://….turso.io`로, 발급한 토큰을 `DATABASE_AUTH_TOKEN`에 넣는다. 지금 쓰는 `@libsql/client`가 그대로 지원한다. 스키마 반영(`drizzle-kit push`)과 시드를 Turso를 대상으로 한 번 실행하면 된다 | 거의 없음 (환경변수만) |
| **PostgreSQL** (Neon, Supabase 등) | 가장 널리 쓰는 서버형 DB. Vercel Marketplace에서 바로 연결할 수 있다 | 큼. 스키마를 `sqlite-core` → `pg-core`로, 드라이버를 Postgres용으로 바꾸고, SQL 방언 차이(날짜 함수 등)를 고쳐야 한다 |
| **디스크가 유지되는 서버** (Railway·Fly.io 볼륨, 일반 VM) | 서버리스가 아닌 서버에 앱과 SQLite 파일을 함께 둔다 | 거의 없음. 대신 서버 운영(백업, 재시작 등)을 직접 해야 한다 |

참고로 매월 자동 연동(요구사항 4.2)도 DB가 동작해야 의미가 있습니다. Vercel에서는 `web/vercel.json`에 Cron 설정을 넣어 `/api/cron/sync`를 매월 호출하게 할 수 있습니다. 이것도 이번 범위에서는 하지 않습니다.

### 완료 확인

- [ ] GitHub 저장소에 코드가 올라가 있고, `.env`와 `.db` 파일은 없다
- [ ] Vercel 배포 주소가 있고, DB를 쓰는 화면에서 오류가 나는 것을 확인했다
- [ ] Vercel 로그에서 오류 메시지를 찾았다
- [ ] 15-4의 세 방법 중 무엇을 고를지 이유와 함께 정했다

---

## Step 16 — 회고

**목표**: 프로젝트를 정리해서 멘토에게 보냈다. **이 Step으로 멘토링이 끝납니다.**

`docs/retrospective.md`를 만들고 아래 내용을 적습니다.

1. **구현 범위**: 완료한 요구사항 ID, 하지 않은 항목과 이유
2. **명세 해석**: 요구사항이 모호했던 곳과, 그때 어떻게 결정했는지
3. **어려웠던 점**: 가장 오래 막혔던 문제와 해결 방법
4. **AI 활용**: AI가 잘한 일, 틀린 일, 틀린 걸 어떻게 발견했는지
5. **호스팅**: Step 15에서 본 오류 메시지, 원인, 고른 해결 방법과 그 이유
6. **다시 한다면**: 설계나 진행 방식에서 바꿀 점

커밋하고 push한 뒤, 멘토에게 아래를 보냅니다.

- GitHub 저장소 링크 (Private이면 Settings → Collaborators에서 멘토를 초대)
- Vercel 배포 주소
- 회고 문서 링크

---

# 참고 자료

## A. 시스템 명세

### A-1. 구성도

```
┌───────────────────────── Mock 원천 (src_ 테이블) ──────────────────────────┐
│  학적 시스템              재원별 지급 시스템          기관계정 회계 시스템        │
│  src_professor           src_payment               src_account_txn           │
│  src_academic_monthly                              src_account_summary       │
│  src_research_history                                                        │
└──────────┬───────────────────────┬──────────────────────────┬────────────────┘
           │ 학적 연동 JOB-ACAD     │ 지급 연동 JOB-PAY         │ 기관계정 연동 JOB-ACCT
           │   (수동: 연동관리 화면 / 자동: 스케줄러가 /api/cron/sync 호출)
           ▼                       ▼                          ▼
┌──────────────────────────── 본 시스템 테이블 ─────────────────────────────────┐
│  professor · student_monthly ─▶ eligibility_result                           │
│  payment · payment_plan                    account · account_ledger          │
│  공통: rule_config · audit_log · sync_log · sync_error · notification · app_user │
└───────────────────────────────────────────────────────────────────────────────┘
           ▲
┌──────────┴────────── Next.js (App Router) ──────────────────────────────────┐
│  조회: 페이지(Server Component)에서 src/queries/ 함수로 DB 직접 조회             │
│  변경: Server Action (수동 연동 실행, Mock 원천 편집, 지급계획 입력, 설정 변경)     │
│  API:  /api/cron/sync (스케줄러 호출용, 전월 대상 세 Job 실행)                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

- Mock 원천 테이블과 본 시스템 테이블은 **같은 DB 안에** 있습니다. 실제 환경이라면 원천은 별도 시스템이지만, 실습에서는 `src_` 접두어로만 구분합니다.
- 본 시스템 코드는 연동 Job과 Mock 원천 편집 화면, 정합성 검증 쿼리 외에는 `src_` 테이블을 읽지 않습니다.
- 별도 REST API를 만들지 않습니다. 화면은 서버에서 DB를 직접 조회하고, 변경은 Server Action으로 처리합니다. API 라우트는 스케줄러 호출용(`/api/cron/sync`) 하나뿐입니다.

### A-2. 기술 스택

| 구분 | 선택 | 버전 (고정) |
|---|---|---|
| 실행 환경 | Node.js | 24 LTS |
| 프레임워크 | Next.js (App Router) + React | next 16.4.3 / react 19.3.0 |
| 언어 | TypeScript | create-next-app 기본값 (5.x) |
| 스타일 | Tailwind CSS | create-next-app 기본값 (4.x) |
| ORM | Drizzle ORM / drizzle-kit | 0.45.4 / 0.31.11 |
| DB 드라이버 | @libsql/client | 0.18.0 |
| DB | SQLite 파일 `web/local.db` (호스팅 환경의 한계는 Step 15) | — |
| 테스트 | Vitest | 5.0.5 |
| 스크립트 실행 | tsx / dotenv | 4.23.15 / 18.0.9 |
| 호스팅 (시도) | Vercel (Hobby) | — |

`package-lock.json`은 반드시 커밋합니다. 패키지 버전을 올리지 않습니다 (올려야 하면 멘토에게 먼저 묻습니다).

### A-3. 폴더 구조

완성 시점의 구조입니다. `(starter)` 표시는 Step 3에서 복사한 파일입니다.

```
web/
├── .env                      # 로컬 환경변수 (커밋 안 함)
├── .env.example              # (starter) 환경변수 예시
├── .env.test                 # 테스트용 DATABASE_URL
├── drizzle.config.ts         # (starter)
├── vitest.config.mts         # (starter)
├── next.config.ts
└── src/
    ├── app/                  # 화면 (경로는 A-5)
    │   ├── layout.tsx        # 메뉴, force-dynamic
    │   ├── page.tsx          # 홈 / 대시보드
    │   ├── roster/ students/[studentNo]/ professors/ semester/
    │   ├── payments/ payments/plan/ accounts/[accountId]/
    │   ├── checks/ sync/ audit/ notifications/ mock-source/ settings/ login/
    │   └── api/cron/sync/route.ts
    ├── components/           # 공통 UI (Badge, 필터 폼, 표)
    ├── db/
    │   ├── client.ts         # (starter) db 객체
    │   ├── schema.ts         # (starter) 테이블 정의
    │   └── seed.ts           # (starter) 시드, seedAll()
    ├── domain/               # 순수 함수. DB 접근 금지. 단위 테스트 대상
    │   ├── month.ts          # (starter) addMonths + Step 5 추가
    │   ├── eligibility.ts    # Step 5
    │   ├── amount.ts         # Step 5
    │   └── checks.ts         # Step 8
    ├── jobs/                 # 연동 Job. 통합 테스트 대상
    │   ├── run.ts acad.ts pay.ts acct.ts
    │   └── *.int.test.ts
    ├── lib/
    │   ├── audit.ts          # (starter) recordAudit, Tx
    │   ├── codes.ts rules.ts format.ts notify.ts
    │   └── session.ts        # Step 13
    ├── queries/              # 화면용 조회 쿼리 (roster, payments, ledger …)
    └── proxy.ts              # Step 13
```

테스트 파일 이름 규칙: 단위 테스트는 `*.test.ts`, DB를 쓰는 통합 테스트는 `*.int.test.ts`.

### A-4. 데이터 모델

**정확한 정의는 [docs/starter/schema.ts](docs/starter/schema.ts)입니다.** 컬럼마다 의미와 허용 값이 주석으로 적혀 있습니다. 아래는 개요입니다.

| 테이블 | 구분 | 키 | 내용 |
|---|---|---|---|
| `src_professor` | 원천(학적) | prof_id | 지도교수 |
| `src_academic_monthly` | 원천(학적) | src_id | 기준월별 학적. 66행 (11명 × 6개월) |
| `src_research_history` | 원천(학적) | src_id | 월별 연구활동 이력. 과거분 포함 |
| `src_payment` | 원천(지급) | src_id | 학생×월×재원 지급 건. 오류 행 2건 포함 87행 |
| `src_account_txn` | 원천(회계) | src_id | 기관계정 거래 9건 |
| `src_account_summary` | 원천(회계) | account_id, base_date, source_item | 출처별 보고 집계 |
| `professor` | 명부 | prof_id | JOB-ACAD가 채움 |
| `student_monthly` | 명부 | base_ym, student_no | 학적 스냅샷 + 누적지원개월. JOB-ACAD가 채움 |
| `eligibility_result` | 명부 | base_ym, student_no | R1~R4, 종합, 기한, 기준금액. JOB-ACAD가 채움 |
| `payment` | 지급 | payment_id (src_ref_id 유일) | JOB-PAY가 채움 |
| `payment_plan` | 지급 | base_ym, student_no, fund_code | 화면에서 입력 (P2) |
| `account` | 기관계정 | account_id | 계정 마스터. 시드가 넣음 (A01, A02) |
| `account_ledger` | 기관계정 | txn_id (src_ref_id 유일) | JOB-ACCT가 채움 |
| `rule_config` | 공통 | key | 업무 규칙 숫자. 시드가 넣음 (11개) |
| `audit_log` | 공통 | log_id | 감사로그 |
| `sync_log`, `sync_error` | 공통 | sync_id / err_id | 연동 실행 이력, 오류 행 |
| `notification` | 공통 | noti_id | 알림 |
| `app_user` | 공통 | user_id | 로그인 (P2) |

**저장 형식**: 기준월 `'YYYY-MM'`, 날짜 `'YYYY-MM-DD'`, 시각 ISO 8601 문자열(`new Date().toISOString()`), 금액 정수(원), O/X·Y/N은 한 글자 문자열.

**감사로그의 `row_key` 형식**: 키 컬럼 값을 `|`로 이어 붙입니다.

| 테이블 | row_key 예시 |
|---|---|
| student_monthly, eligibility_result | `2026-03|2023210001` |
| payment, account_ledger | `src_ref_id` 값 (예: `PAY-2026-03-2023210001-F11`) |
| payment_plan | `2026-03|2023210001|F11` |
| professor, rule_config | `P01`, `max_months.석사` |

**스키마를 바꿔야 할 때**: `src/db/schema.ts`를 고친 뒤 `npm run db:reset`을 실행합니다. 마이그레이션 파일은 쓰지 않습니다 (`drizzle-kit push`로 바로 반영).

### A-5. 화면 경로

| 화면 | 경로 | Step |
|---|---|---|
| SCR-01 대시보드 | `/?tab=roster` | 12 |
| SCR-02 명부 | `/roster?ym=2026-03` | 8 |
| SCR-03 학생 상세 | `/students/2023210001?ym=2026-03&tab=info` | 8, 9, 11 |
| SCR-04 지도교수별 집계 | `/professors?ym=2026-03&view=roster` | 8, 9 |
| SCR-05 학기 조회 | `/semester?term=2026-1&view=roster` | 12 |
| SCR-06 지급내역 | `/payments?ym=2026-03` | 9 |
| SCR-07 계획 vs 실지급 | `/payments/plan?ym=2026-03` | 12 |
| SCR-08 기관계정 원장 | `/accounts/A01?from=2026-01-01&to=2026-06-30` | 10 |
| SCR-09 정합성 점검 | `/checks?ym=2026-03` | 12 |
| SCR-10 연동관리 | `/sync` | 6, 7 |
| SCR-11 감사로그 | `/audit` | 11 |
| SCR-12 알림함 | `/notifications` | 12 |
| SCR-13 Mock 원천 편집 | `/mock-source?table=src_payment` | 11 |
| SCR-14 기준정보 | `/settings` | 12 |
| 로그인 | `/login` | 13 |

- 조회 조건은 모두 **URL 쿼리 파라미터**로 둡니다. 새로고침하거나 링크를 공유해도 같은 화면이 나오게 하기 위해서입니다.
- 기준월(`ym`)이 없으면 시드 데이터가 있는 `2026-03`을 기본값으로 씁니다.

### A-6. 코드 규칙

1. **업무 규칙의 숫자를 코드에 직접 쓰지 않는다.** 기준금액, 최대지원개월, 인정 활동유형 등은 `loadRules()`로 `rule_config`에서 읽는다.
2. **`src/domain/`은 DB를 import하지 않는다.** 필요한 값은 인자로 받는다. 그래야 DB 없이 단위 테스트를 할 수 있다.
3. **본 시스템 테이블에 쓰는 모든 코드는 같은 트랜잭션 안에서 `recordAudit()`을 호출한다.** `db.transaction(async (tx) => { … })` 안에서 `tx`로 쓰고 바로 감사로그를 남긴다. 예외: `sync_log`, `sync_error`, `notification`, `audit_log` 자체.
4. **집계·정합성 검증 쿼리는 SQL로 직접 쓴다.** Drizzle의 `sql` 템플릿(`db.all(sql\`…\`)` 등)을 쓴다. 단순 조회·저장은 Drizzle 문법을 쓴다.
5. **페이지는 Server Component로 만든다.** 클릭 후 상태가 바뀌는 등 브라우저 상호작용이 꼭 필요한 작은 컴포넌트에만 `'use client'`를 붙인다. 필터·탭·정렬은 URL 쿼리와 `<Link>`/`<form method="get">`으로 처리하면 클라이언트 코드가 필요 없다.
6. **금액·O/X·`-`·`0`·마스킹 표시는 `src/lib/format.ts`** 한 곳에서 처리한다.
7. **기준월 계산은 `src/domain/month.ts`** 의 함수만 쓴다. `Date` 객체로 월을 더하지 않는다 (시간대 오류가 생기기 쉽다).

### A-7. 화면 코드 패턴

아래 코드는 이 버전(Next.js 16.4.3)에서 빌드와 실행을 확인한 패턴입니다.

**① 쿼리 파라미터를 받는 페이지** — `searchParams`는 **Promise**이므로 `await`합니다. `PageProps<'/경로'>` 타입은 Next.js가 자동으로 만들어 줍니다.

```tsx
// src/app/roster/page.tsx
export default async function RosterPage({ searchParams }: PageProps<'/roster'>) {
  const { ym = '2026-03' } = await searchParams;
  // ym은 string | string[] | undefined 이므로 필요하면 String(ym)으로 변환
  // const rows = await getRoster({ ym: String(ym) });
  return <main>…</main>;
}
```

**② 동적 경로** — `params`도 Promise입니다.

```tsx
// src/app/students/[studentNo]/page.tsx
export default async function StudentPage({ params, searchParams }: PageProps<'/students/[studentNo]'>) {
  const { studentNo } = await params;
  const { ym = '2026-03', tab = 'info' } = await searchParams;
  return <main>…</main>;
}
```

**③ 폼 → Server Action → 결과 페이지로 이동**

```ts
// src/app/sync/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { runAcadJob } from '@/jobs/acad';

export async function runSyncAction(formData: FormData) {
  const jobCode = String(formData.get('jobCode'));
  const target = String(formData.get('target'));
  const { syncId } = await runAcadJob(target, 'MANUAL'); // jobCode에 따라 분기
  redirect(`/sync?syncId=${syncId}`);
}
```

```tsx
// src/app/sync/page.tsx (일부)
import { runSyncAction } from './actions';

<form action={runSyncAction}>
  <select name="jobCode" defaultValue="JOB-ACAD">
    <option>JOB-ACAD</option>
  </select>
  <input name="target" type="month" defaultValue="2026-03" />
  <button type="submit">실행</button>
</form>
```

**④ 필터 폼** — Server Action 없이 GET으로 쿼리만 바꿉니다.

```tsx
<form method="get">
  <input name="ym" type="month" defaultValue={ym} />
  <select name="degree" defaultValue={degree ?? ''}>
    <option value="">전체</option>
    <option>석사</option><option>박사</option><option>석박통합</option>
  </select>
  <button type="submit">조회</button>
</form>
```

**⑤ SQL 직접 쓰기 — 출처별 누적잔액**

```ts
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const rows = await db.all<{ txn_date: string; source_item: string; amount: number; balance: number }>(sql`
  SELECT txn_date, source_item, direction, amount,
         SUM(CASE WHEN direction = 'IN' THEN amount ELSE -amount END)
           OVER (PARTITION BY source_item ORDER BY txn_date, txn_id) AS balance
  FROM account_ledger
  WHERE account_id = ${accountId}
  ORDER BY txn_date, txn_id
`);
```

`${accountId}`처럼 넣은 값은 자동으로 SQL 파라미터가 됩니다 (SQL 인젝션 안전). 문자열을 `+`로 이어 붙여 SQL을 만들지 않습니다.

**모르는 Next.js API가 나오면**: 인터넷 검색보다 `web/node_modules/next/dist/docs/`의 문서를 먼저 봅니다. 설치된 버전과 정확히 맞는 공식 문서입니다.

---

## B. 모듈 인터페이스

직접 만들 함수의 이름과 입출력입니다. **이름과 타입을 이대로 맞추면** 이 문서의 테스트 표와 예시를 그대로 쓸 수 있습니다. 내부 구현은 자유입니다.

### B-1. 공통 (lib)

```ts
// src/lib/codes.ts
export const DEGREES = ['석사', '박사', '석박통합'] as const;
export type Degree = (typeof DEGREES)[number];
export const ACAD_STATUSES = ['재학', '휴학', '수료', '졸업', '제적'] as const;
export const ACTIVITY_TYPES = ['RND', 'LAB', 'NONE'] as const;
export const FUNDS = [
  { code: 'F11', group: '통합관리', name: '대학계정' },
  { code: 'F12', group: '통합관리', name: '기관 세부계정' },
  { code: 'F13', group: '통합관리', name: '연구책임자계정' },
  { code: 'F20', group: '비통합관리 R&D', name: '정부·지자체·민간 R&D' },
  { code: 'F30', group: 'BK21', name: 'BK21 장학금' },
  { code: 'F40', group: '국고·지자체', name: '그 외 국고·지자체 지원' },
  { code: 'F90', group: '기타', name: '기타' },
] as const;
export const LEDGER_ITEMS = [
  { code: 'I_CARRY', direction: 'IN', name: '전년도 잔액(이월)' },
  // … 요구사항 3.4의 9개 항목
] as const;
```

```ts
// src/lib/rules.ts
export type Rules = {
  eligibleAcadStatus: string;            // 'eligible.acad_status'
  eligibleFulltimeYn: string;            // 'eligible.fulltime_yn'
  eligibleActivityTypes: string[];       // 'eligible.activity_types' 를 쉼표로 분리
  maxMonths: Record<Degree, number>;     // 'max_months.석사' / '.박사' / '.석박통합'
  standardAmount: {
    석사: number;                         // 'standard_amount.석사'
    박사: number;                         // 'standard_amount.박사'
    석박통합Early: number;                 // 'standard_amount.석박통합.early'
    석박통합Late: number;                  // 'standard_amount.석박통합.late'
  };
  integratedLateFromSemester: number;    // 'integrated.late_from_semester'
};
export async function loadRules(): Promise<Rules>;
```

```ts
// src/lib/format.ts
export function formatWon(n: number | null): string;          // 1200000 → '1,200,000', null → '-'
export function formatOX(v: 'O' | 'X' | null): string;        // null → '-'
export function maskResearcherNo(no: string): string;         // '20000001' → '2000****'
```

### B-2. 판정 엔진 (domain)

```ts
// src/domain/month.ts
export function addMonths(ym: string, n: number): string;     // (starter) '2026-11', 3 → '2027-02'
export function termOf(ym: string): string;                   // '2026-03' → '2026-1', '2027-01' → '2026-2'
export function termMonths(term: string): string[];           // '2026-1' → ['2026-03', …, '2026-08']
export function previousYmKst(now: Date): string;             // 한국 시간 기준 전월
export function lastDayOf(ym: string): string;                // '2026-02' → '2026-02-28' (Step 7)
```

```ts
// src/domain/eligibility.ts
export type OX = 'O' | 'X';

export type EligibilityInput = {
  baseYm: string;
  degree: Degree;
  acadStatus: string;
  fulltimeYn: string;
  activityType: string;
  semesterNo: number;
  cumSupportMonths: number;
};

export type EligibilityResult = {
  r1: OX; r2: OX; r3: OX; r4: OX;
  overall: OX;
  maxSupportYm: string | null;     // r4 = 'X' 이면 null
  standardAmount: number | null;   // overall = 'X' 이면 null
};

export function countCumSupportMonths(
  history: { ym: string; activityType: string }[],   // 한 학생의 이력
  baseYm: string,
  rules: Rules,
): number;

export function judge(input: EligibilityInput, rules: Rules): EligibilityResult;
```

```ts
// src/domain/amount.ts
export function meetsStandard(standardAmount: number | null, totalPaid: number): OX | null;  // 기준금액 null → null
export function shortage(standardAmount: number | null, totalPaid: number): number | null;   // max(0, 기준 − 총액)
```

### B-3. 감사로그, 알림, 연동 실행

```ts
// src/lib/audit.ts  (starter, 이미 있음)
export type Tx = /* db.transaction 콜백의 tx 타입 */;
export async function recordAudit(tx: Tx, e: {
  tableName: string; rowKey: string; action: 'C' | 'U' | 'D';
  before?: object | null; after?: object | null; actor: string;
}): Promise<void>;
```

```ts
// src/lib/notify.ts
export async function createNotification(tx: Tx, n: {
  receiver: string;   // 'ADMIN'
  type: 'ACAD_STATUS_CHANGED' | 'REQ_DETAIL_CHANGED' | 'ELIGIBILITY_CHANGED' | 'SYNC_ALERT';
  title: string; body: string; link?: string;
}): Promise<void>;
```

```ts
// src/jobs/run.ts
export type JobCode = 'JOB-ACAD' | 'JOB-PAY' | 'JOB-ACCT';
export type Trigger = 'MANUAL' | 'SCHEDULE';

export type JobContext = {
  tx: Tx;
  syncId: number;
  actor: string;                      // 'SYSTEM:JOB-ACAD' 등
  read(n?: number): void;             // 읽은 건수 +n (기본 1)
  ok(n?: number): void;               // 성공 건수 +n
  error(e: { srcTable: string; srcRefId: string; errorCode: 'E_REQUIRED' | 'E_CODE' | 'E_REF' | 'E_VALUE'; message: string }): Promise<void>;
};

export type JobResult = { syncId: number; status: 'SUCCESS' | 'PARTIAL' | 'FAILED' };

export async function runJob(
  jobCode: JobCode, target: string, trigger: Trigger,
  body: (ctx: JobContext) => Promise<void>,
): Promise<JobResult>;
```

```ts
// src/jobs/acad.ts, pay.ts, acct.ts
export async function runAcadJob(baseYm: string, trigger: Trigger): Promise<JobResult>;
export async function runPayJob(baseYm: string, trigger: Trigger): Promise<JobResult>;
export async function runAcctJob(from: string, to: string, trigger: Trigger): Promise<JobResult>;
```

### B-4. 정합성 검증과 조회 쿼리

```ts
// src/domain/checks.ts
export type FieldDiff = { field: string; ours: unknown; source: unknown };
export type CheckResult = { ok: boolean; diffs: FieldDiff[]; note?: string };  // note 예: '원천에 없음'

/** 두 객체의 지정 필드를 비교한다. 한쪽이 null이면 note를 채우고 ok=false. */
export function diffFields<T extends Record<string, unknown>>(
  ours: T | null, source: T | null, fields: (keyof T)[],
): CheckResult;
```

```ts
// src/queries/roster.ts (예시 — 다른 쿼리 파일도 같은 방식)
export type RosterFilter = { ym: string; degree?: string; dept?: string; advisor?: string; overall?: 'O' | 'X'; q?: string };
export type RosterRow = {
  // student_monthly + professor 이름·번호 + eligibility_result 필드
  chk01: CheckResult; chk02: CheckResult; chk03: CheckResult;
};
export async function getRoster(filter: RosterFilter): Promise<RosterRow[]>;
```

---

## C. 연동 Job 처리 절차

요구사항 4장을 코드 순서로 풀어 쓴 것입니다. upsert(있으면 수정, 없으면 추가), 멱등성 같은 용어는 [요구사항 2.1](docs/요구사항.md#21-용어-사전)을 봅니다.

### C-1. 공통: runJob

```
1. sync_log에 행 추가: status='RUNNING', started_at=지금  (트랜잭션 밖)
2. errors = [], readCnt = 0, okCnt = 0
3. try:
     db.transaction(async tx => body(ctx))
       - ctx.error()는 sync_error에 행을 추가하고 errors에 쌓는다
   catch (e):
     sync_log 갱신: status='FAILED', message=e.message, ended_at=지금
     SYNC_ALERT 알림 생성 (새 트랜잭션)
     return FAILED
4. status = errors가 0건이면 'SUCCESS', 아니면 'PARTIAL'
5. sync_log 갱신: status, read_cnt, ok_cnt, err_cnt, ended_at
6. PARTIAL이면 SYNC_ALERT 알림 생성 (제목 예: "JOB-PAY 2026-03 연동 오류 2건")
7. return { syncId, status }
```

`FAILED`일 때는 트랜잭션이 롤백되므로 그 안에서 쓴 `sync_error`도 함께 사라집니다. 원인은 `sync_log.message`로 확인합니다.

### C-2. JOB-ACAD

입력: `baseYm`. actor: `SYSTEM:JOB-ACAD`.

```
1. 지도교수
   src_professor 전체를 읽는다.
   필수값 검사(E_REQUIRED) → 통과한 행을 professor에 upsert.
     - 없던 행: insert + 감사로그 C
     - 값이 다른 행: update + 감사로그 U (before/after)
     - 같은 행: 아무것도 하지 않음
   (지도교수 행은 read/ok 건수에 넣지 않는다)

2. 학적
   src_academic_monthly에서 base_ym = baseYm 인 행을 읽는다. 각 행마다 read() 후
     검사 순서: E_REQUIRED → E_CODE → E_REF(advisor_id가 professor에 있나) → E_VALUE(semester_no ≥ 1)
     오류면 error() 후 다음 행으로.
   통과한 행:
     cum = countCumSupportMonths(이 학생의 src_research_history 전체, baseYm, rules)
     student_monthly에 upsert (비교 시 synced_at 제외, 쓸 때는 synced_at=지금)
     ok()

3. 삭제
   student_monthly에서 base_ym = baseYm 이면서, 2단계에서 통과한 학번 목록에 없는 행:
     같은 키의 eligibility_result 삭제 + 감사로그 D
     student_monthly 삭제 + 감사로그 D

4. 판정과 알림
   2단계에서 통과한 학생마다:
     prev = 같은 baseYm의 기존 eligibility_result·student_monthly 값
            (없으면 addMonths(baseYm, -1) 월의 값, 그것도 없으면 null)
            ※ 2단계에서 student_monthly를 덮어쓰기 전에 기존 값을 미리 읽어 두어야 한다
     result = judge(학적 값 + cum, rules)
     eligibility_result에 upsert (비교 시 judged_at 제외)
     prev가 있으면 4.3 규칙대로 알림 생성:
       학적상태 다름        → ACAD_STATUS_CHANGED
       r1~r4 중 하나라도 다름 → REQ_DETAIL_CHANGED
       overall 다름         → ELIGIBILITY_CHANGED
```

### C-3. JOB-PAY

입력: `baseYm`. actor: `SYSTEM:JOB-PAY`.

```
1. src_payment에서 base_ym = baseYm 인 행을 읽는다. 각 행마다 read() 후
     검사 순서: E_REQUIRED(student_no, fund_code, amount, paid_date)
              → E_CODE(fund_code가 FUNDS에 있나)
              → E_REF(student_monthly에 (baseYm, student_no)가 있나)
              → E_VALUE(amount < 0 이거나 paid_date가 YYYY-MM-DD 형식이 아님)
   통과한 행: payment에 src_ref_id = src_id 기준으로 upsert, ok()
2. payment에서 base_ym = baseYm 이면서 1단계에서 통과한 src_id 목록에 없는 행 → 삭제 + 감사로그 D
```

### C-4. JOB-ACCT

입력: `from`, `to` (`YYYY-MM-DD`). target 문자열은 `${from}~${to}`. actor: `SYSTEM:JOB-ACCT`.

```
1. src_account_txn에서 from ≤ txn_date ≤ to 인 행을 읽는다. 각 행마다 read() 후
     검사 순서: E_REQUIRED → E_CODE(direction, item_code, source_item이 I_로 시작하는 항목인가)
              → E_REF(account_id가 account에 있나)
              → E_VALUE(amount ≤ 0, 또는 direction='IN'인데 source_item ≠ item_code)
   통과한 행: account_ledger에 src_ref_id 기준 upsert, ok()
2. account_ledger에서 기간 안이면서 통과한 src_id 목록에 없는 행 → 삭제 + 감사로그 D
```

### C-5. Cron 라우트

스케줄러가 매월 호출할 API입니다. 이 실습에서는 스케줄러에 등록하지 않고, Step 7에서 `curl`로 직접 호출해 확인합니다.

```ts
// src/app/api/cron/sync/route.ts
import { previousYmKst, lastDayOf } from '@/domain/month';
import { runAcadJob } from '@/jobs/acad';
import { runPayJob } from '@/jobs/pay';
import { runAcctJob } from '@/jobs/acct';

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const ym = previousYmKst(new Date());
  const acad = await runAcadJob(ym, 'SCHEDULE');
  const pay = await runPayJob(ym, 'SCHEDULE');
  const acct = await runAcctJob(`${ym}-01`, lastDayOf(ym), 'SCHEDULE');
  return Response.json({ ym, acad, pay, acct });
}
```

`lastDayOf(ym)`(그 달의 마지막 날짜)는 Step 7에서 `src/domain/month.ts`에 직접 만들고 테스트합니다.

| 입력 | 기대 결과 |
|---|---|
| `'2026-02'` | `'2026-02-28'` |
| `'2028-02'` | `'2028-02-29'` (윤년) |
| `'2026-04'` | `'2026-04-30'` |
| `'2026-12'` | `'2026-12-31'` |

`Date`를 쓴다면 `new Date(Date.UTC(year, month, 0)).getUTCDate()`처럼 **UTC 함수만** 씁니다. 로컬 시간 함수와 `toISOString()`을 섞으면 한국 시간에서 하루가 밀릴 수 있습니다 (A-6 규칙 7).

---

## D. AI 도구 활용 가이드

### D-1. 원칙

- **명세가 기준입니다.** AI에게 일을 맡길 때는 Step 번호와 요구사항 절을 함께 줍니다.
  - 좋은 예: "README Step 5와 docs/요구사항.md 3.1·3.2를 읽고, B-2 인터페이스대로 src/domain/eligibility.ts와 테스트를 만들어 줘. 테스트 케이스는 Step 5 표를 모두 넣어."
  - 나쁜 예: "지원요건 판정 만들어 줘."
- **테스트를 먼저 만들게 하고, 테스트가 정답표와 맞는지 직접 확인합니다.** AI가 테스트의 기대값을 구현에 맞춰 바꾸는 경우가 있습니다. 기대값은 요구사항 9장 정답표가 기준입니다.
- **이해하지 못한 코드는 커밋하지 않습니다.** 모르는 줄이 있으면 AI에게 설명을 요청하고, 그래도 모르면 멘토에게 묻습니다.
- **요구사항을 바꾸지 않습니다.** AI가 "이렇게 하는 게 더 낫다"며 규칙을 바꾸려 하면 받아들이지 말고, 정말 바꿔야 한다고 생각되면 회고 문서에 적습니다.

### D-2. 규칙 파일

Step 3에서 프로젝트 폴더 최상위에 `AGENTS.md`로 저장할 내용입니다.

```markdown
# 프로젝트 규칙

## 문서
- 진행 순서와 설계: README.md (Step, 부록 A~C)
- 요구사항과 정답표: docs/요구사항.md
- 지금 하는 Step 밖의 일은 하지 않는다. 요구사항이 모호하면 추측하지 말고 질문한다.

## 환경
- 앱 코드는 web/ 아래에 있다. npm 명령은 web/에서 실행한다.
- Next.js 16.4.3 App Router, React 19, TypeScript, Drizzle ORM 0.45 + @libsql/client (SQLite), Tailwind 4, Vitest 5
- Next.js API는 web/node_modules/next/dist/docs/ 의 문서를 기준으로 한다. 학습된 지식과 다를 수 있다.
- 패키지를 새로 설치하거나 버전을 바꾸지 않는다.
- next.config.ts에 cacheComponents를 켜지 않는다. layout.tsx의 `dynamic = "force-dynamic"`을 지우지 않는다.

## 코드 규칙
- Pages Router(pages/, getServerSideProps)를 쓰지 않는다.
- searchParams와 params는 Promise이다. PageProps<'/경로'> 타입을 쓴다.
- 업무 규칙 숫자(기준금액, 최대지원개월 등)는 코드에 쓰지 않고 loadRules()로 읽는다.
- src/domain/은 @/db를 import하지 않는 순수 함수다. 테스트를 함께 작성한다.
- 본 시스템 테이블에 쓰면 같은 트랜잭션에서 recordAudit()을 호출한다.
- 집계·정합성 쿼리는 drizzle의 sql 템플릿으로 SQL을 직접 쓴다. 문자열 연결로 SQL을 만들지 않는다.
- 월 계산은 src/domain/month.ts 함수만 쓴다.
- 금액은 정수(원)다. 표시는 src/lib/format.ts를 쓴다.
- 테스트 기대값은 docs/요구사항.md 9장 정답표를 따른다. 테스트가 실패하면 기대값이 아니라 구현을 고친다.

## 완료 전 확인
- npm test, npm run build 가 통과해야 한다.
```

### D-3. AI가 자주 틀리는 부분

| 증상 | 원인 | 대응 |
|---|---|---|
| `pages/` 폴더나 `getServerSideProps` 사용 | 옛 Pages Router 방식 | 규칙 파일에 금지 명시 (D-2에 포함) |
| `params.studentNo`를 `await` 없이 사용 | Next.js 15부터 Promise로 바뀜 | A-7 패턴 ①② |
| "uncached or runtime data during prerendering" 빌드 오류 | `cacheComponents`가 다시 켜졌거나 `force-dynamic`이 지워짐 | Step 3-4 다시 확인 |
| "useState only works in Client Components" | 서버/클라이언트 컴포넌트 경계 혼동 | 상호작용이 필요한 부분만 별도 파일로 떼고 `'use client'` |
| `middleware.ts` 생성 | Next.js 16에서 `proxy.ts`로 이름이 바뀜 | Step 13 참고 |
| 금액 합계가 이상함 | DB 값이 문자열로 와서 `+`가 문자열 연결이 됨 | `db.all` 결과는 `Number()`로 변환, 테스트로 확인 |
| 월 계산이 하루·한 달 밀림 | `Date`와 `toISOString()`의 시간대 차이 | `src/domain/month.ts`만 사용 |
| 테스트 기대값을 구현에 맞춰 수정 | AI가 테스트를 통과시키려고 함 | 기대값은 정답표 기준, diff에서 테스트 변경을 반드시 확인 |

---

## E. Git 사용 방법

Git은 **내 컴퓨터에서 버전 관리용으로만** 씁니다. 브랜치나 PR은 쓰지 않아도 됩니다. GitHub에는 마지막 Step 15에서 한 번 올립니다.

### E-1. 언제 커밋하나

- **Step 하나가 끝날 때마다** 커밋합니다 (완료 확인을 모두 통과한 뒤).
- Step이 길면 중간에도 자주 커밋합니다. 함수 하나, 화면 하나처럼 의미 있는 단위가 동작할 때마다 커밋하면 망가졌을 때 되돌리기 쉽습니다.

```bash
# 프로젝트 폴더(stipend-mentoring/)에서
git status                     # 무엇이 바뀌었는지 확인 (.env, .db 가 없어야 함)
git add .
git commit -m "feat(step-05): 지원요건 판정 judge 구현"
```

### E-2. 커밋 메시지

`종류(step-번호): 설명` 형식으로 씁니다.

| 종류 | 언제 | 예 |
|---|---|---|
| `feat` | 기능 추가 | `feat(step-08): 명부 목록 필터 구현` |
| `fix` | 버그 수정 | `fix(step-09): 미지급 재원이 빈칸으로 나오는 문제 수정` |
| `test` | 테스트만 추가·수정 | `test(step-05): S06 기한 만료 케이스 추가` |
| `chore` | 설정, 패키지 | `chore: vitest 설정 수정` |
| `docs` | 문서 | `docs: 회고 작성` |

### E-3. 자주 쓰는 명령

| 하고 싶은 일 | 명령 |
|---|---|
| 커밋 기록 보기 | `git log --oneline` |
| 커밋 전 변경 내용 보기 | `git diff` |
| 커밋하지 않은 파일 하나를 마지막 커밋 상태로 되돌리기 | `git restore <파일>` |
| 예전 커밋 상태를 잠깐 보기 | `git switch --detach <커밋ID>` → 다 보면 `git switch main` |
| 실험을 따로 해 보기 (선택) | `git switch -c try-something` → 마음에 들면 `git switch main` 후 `git merge try-something` |

### E-4. 하지 말 것

- `.env`, `*.db` 파일을 커밋하지 않습니다. 커밋 전에 `git status`로 확인합니다.
- AI 도구가 만든 변경을 확인하지 않고 커밋하지 않습니다. `git diff`로 먼저 봅니다.

---

## F. 문제 해결 FAQ

| 증상 | 해결 |
|---|---|
| DB 데이터가 꼬였다 | `npm run db:reset` |
| `npm i` 할 때 `ERESOLVE` 오류 | Step 3-3의 두 번째 명령을 `@types/node@24.19.2`까지 포함해 다시 실행 |
| `DATABASE_URL`이 undefined | `web/.env`가 있는지 확인 (`cp .env.example .env`) |
| 테스트가 개발용 데이터를 지운 것 같다 | `vitest.config.mts`의 `env.DATABASE_URL`이 `file:test.db`인지 확인. 테스트는 `test.db`만 써야 함 |
| `npm test`에서 `no such table` | `npm run test:prepare`가 실행되지 않았음. `npm test`로 실행 (`npx vitest` 직접 실행 금지) |
| `SQLITE_CONSTRAINT: FOREIGN KEY` | 참조되는 행보다 참조하는 행을 먼저 넣었거나, 참조되는 행을 먼저 지웠음. 넣을 때는 부모 → 자식, 지울 때는 자식 → 부모 순서 |
| `SQLITE_BUSY: database is locked` | Drizzle Studio나 다른 프로세스가 DB를 쓰는 중. Studio를 끄고 다시 시도 |
| 포트 3000이 사용 중 | 다른 터미널의 `npm run dev`를 끄거나 `npm run dev -- -p 3001` |
| 빌드 오류 "uncached or runtime data during prerendering" | Step 3-4의 설정이 되돌려졌는지 확인 |
| 시드 스크립트에서 "Top-level await is currently not supported" | `tsx`로 실행하는 스크립트는 최상위에서 `await`를 쓸 수 없음. `async function main()`으로 감싸기 |
| 한글 경로에서 이상한 오류 | 폴더를 영문 경로(`~/dev/stipend-mentoring`)로 옮기기 |
| `git push`에서 인증 오류 | 브라우저 로그인 창이 안 뜨면 [GitHub CLI](https://cli.github.com)를 설치하고 `gh auth login` 후 다시 push |
| Vercel 빌드 실패 | 로컬에서 `npm run build`를 먼저 실행해 같은 오류가 나는지 확인. Root Directory가 `web`인지 확인 |
| Vercel에서 404 | Root Directory가 `web`인지 확인 |
| Vercel 배포 후 화면에서 500 오류 | DB를 쓰는 화면이라면 **정상**입니다. Step 15-3 참고 |

---

## G. 기술 용어 사전

이 README에 나오는 기술 용어입니다. 업무·시스템 용어(원천, 연동, 정합성 검증 등)는 [요구사항 2.1](docs/요구사항.md#21-용어-사전)에 있습니다.

**웹·Next.js**

| 용어 | 뜻 |
|---|---|
| Node.js | 브라우저 밖에서 JavaScript를 실행하는 프로그램. 설치하면 `npm`도 함께 설치된다 |
| npm, 패키지 | Node.js용 라이브러리(패키지)를 설치·관리하는 도구. 설치한 목록은 `package.json`, 정확한 버전은 `package-lock.json`에 기록된다 |
| TypeScript | 변수와 함수에 타입을 붙일 수 있는 JavaScript. 타입이 틀리면 실행 전에 오류를 알려 준다 |
| React | 화면을 컴포넌트(재사용 가능한 화면 조각) 단위로 만드는 라이브러리 |
| Next.js | React로 화면과 서버 코드를 한 프로젝트에서 만드는 웹 프레임워크 |
| App Router | Next.js의 폴더 규칙. `src/app/roster/page.tsx` 파일이 `/roster` 주소의 화면이 된다 |
| Server Component | 서버에서 실행되어 HTML로 바뀌어 전달되는 컴포넌트. DB를 직접 조회할 수 있다. Next.js의 기본값 |
| Client Component | 브라우저에서 실행되는 컴포넌트. 파일 맨 위에 `'use client'`를 쓴다. 클릭할 때마다 화면 상태가 바뀌는 기능에 필요하다 |
| Server Action | 폼을 제출하면 서버에서 실행되는 함수. 파일 맨 위에 `'use server'`를 쓴다. 이 프로젝트에서 데이터 변경은 모두 Server Action으로 한다 |
| 쿼리 파라미터 | 주소의 `?` 뒤에 붙는 값. `/roster?ym=2026-03`에서 `ym=2026-03` |
| 동적 경로 | `[studentNo]`처럼 대괄호 이름의 폴더. `/students/2023210001`의 `2023210001` 부분을 값으로 받는다 |
| API 라우트 | 화면 대신 데이터(JSON 등)를 돌려주는 주소. `route.ts` 파일로 만든다 |
| `force-dynamic` | 페이지를 미리 만들어 두지 않고 요청할 때마다 새로 그리게 하는 설정. 항상 최신 DB 값을 보여 주기 위해 쓴다 |
| 캐시 | 한 번 만든 결과를 저장해 두고 다시 쓰는 것. 빠르지만 최신 값이 아닐 수 있다 |
| Tailwind CSS | `p-8`, `text-red-600` 같은 클래스 이름으로 스타일을 입히는 CSS 도구 |
| 개발 서버 | `npm run dev`로 띄우는 내 컴퓨터용 서버. 코드를 저장하면 바로 반영된다 |
| 빌드 | 배포용으로 코드를 변환·검사하는 과정 (`npm run build`). 개발 서버에서 안 보이던 오류가 여기서 나오기도 한다 |
| `curl` | 터미널에서 주소를 호출하는 명령. 화면 없이 API를 시험할 때 쓴다 |

**DB**

| 용어 | 뜻 |
|---|---|
| DB, 테이블, 행, 컬럼 | 데이터 저장소 / 표 하나 / 표의 한 줄 / 표의 한 칸(항목) |
| PK (기본 키) | 행을 하나로 구분하는 컬럼. 예: `student_monthly`는 (기준월, 학번) |
| FK (외래 키) | 다른 테이블의 행을 가리키는 컬럼. 예: `student_monthly.advisor_id` → `professor.prof_id`. 가리키는 행이 없으면 저장할 수 없다 |
| SQL | DB에 데이터를 조회·저장하라고 명령하는 언어 (`SELECT`, `INSERT` 등) |
| SQLite | DB 서버 없이 **파일 하나**(`local.db`)에 저장하는 DB. 설치가 필요 없다 |
| libSQL, `@libsql/client` | SQLite와 호환되는 DB와 그 연결 라이브러리. 로컬 SQLite 파일에도 쓸 수 있다 |
| ORM | DB 테이블을 프로그래밍 언어의 객체처럼 다루게 해 주는 도구 |
| Drizzle ORM | 이 프로젝트에서 쓰는 ORM. SQL과 문법이 비슷하다 |
| 스키마 | 테이블과 컬럼 구조의 정의. 이 프로젝트에서는 `src/db/schema.ts` |
| `drizzle-kit push` | 스키마 파일의 내용을 실제 DB에 반영하는 명령 |
| Drizzle Studio | 브라우저에서 DB 테이블을 보고 편집하는 도구 (`npm run db:studio`) |
| 트랜잭션 | 여러 DB 작업을 하나로 묶은 것. 중간에 하나라도 실패하면 전부 취소된다 |
| 롤백 | 트랜잭션이 실패해 그때까지의 변경을 모두 되돌리는 것 |
| 윈도우 함수 | 행마다 앞선 행들을 포함한 누적 합계 등을 계산하는 SQL 기능. `SUM(...) OVER (...)` |
| SQL 인젝션 | 사용자 입력이 SQL 명령의 일부로 실행되는 보안 문제. 값을 문자열로 이어 붙이지 않고 파라미터로 넘기면 막을 수 있다 |

**테스트·환경**

| 용어 | 뜻 |
|---|---|
| 단위 테스트 | 함수 하나를 DB 없이 입력·출력만으로 검사하는 테스트 (`*.test.ts`) |
| 통합 테스트 | DB까지 포함해 여러 부분이 함께 동작하는지 검사하는 테스트 (`*.int.test.ts`). 이 프로젝트에서는 `test.db`를 쓴다 |
| Vitest | 이 프로젝트에서 쓰는 테스트 도구 (`npm test`) |
| 환경변수, `.env` | 프로그램 밖에서 넣어 주는 설정값(DB 주소, 비밀 키 등)과 그것을 적어 둔 파일. 비밀정보가 있을 수 있어 Git에 올리지 않는다 |
| 해시 (bcrypt) | 원래 값을 알아낼 수 없게 변환한 값. 비밀번호는 해시로 저장한다 (Step 13) |
| 쿠키, 세션 | 브라우저에 저장되는 작은 값 / 로그인 상태 정보 (Step 13) |
| HMAC 서명 | 비밀 키로 만든 값을 붙여, 내용이 위조되지 않았는지 확인하는 방법 (Step 13) |

**Git·호스팅**

| 용어 | 뜻 |
|---|---|
| Git | 파일의 변경 이력을 기록하는 버전 관리 도구 |
| 커밋 | 현재 변경 내용을 이력에 한 번 기록하는 것 |
| `.gitignore` | Git이 기록하지 않을 파일 목록 (`.env`, `*.db` 등) |
| GitHub, 저장소 | Git 이력을 인터넷에 올려 두는 서비스 / 프로젝트 하나의 이력 보관소 |
| push | 내 컴퓨터의 커밋을 GitHub에 올리는 것 |
| 호스팅, 배포 | 만든 웹 서비스를 인터넷에서 접속할 수 있게 서버에 올리는 것 |
| Vercel | Next.js를 만든 회사의 호스팅 서비스. GitHub 저장소를 연결하면 자동으로 빌드·배포한다 |
| 서버리스 | 서버를 직접 관리하지 않고, 요청이 올 때마다 실행 환경이 만들어져 코드를 실행하는 방식. 파일이 유지되지 않는다 (Step 15) |
| 스케줄러, Cron | 정해진 시각마다 작업을 자동 실행하는 기능 / 그 시각을 적는 형식 (`0 0 1 * *` = 매월 1일 0시) |
| Turso | SQLite와 호환되는 클라우드 DB 서비스 (Step 15에서 해결 방법으로 언급) |

**AI 도구**

| 용어 | 뜻 |
|---|---|
| AI 코딩 도구 | 코드를 만들거나 고쳐 주는 AI (Claude Code 등) |
| `AGENTS.md`, `CLAUDE.md` | AI 코딩 도구가 작업 전에 읽는 프로젝트 규칙 파일 (Step 3, D-2) |
