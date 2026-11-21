# 코드 리뷰 안내서 (비개발자용)

이 문서는 개발 경험이 없어도 chanhee-mall 의 코드를 **어떤 순서로, 무엇을 보면서** 읽으면 되는지 안내합니다.

- 목표는 "코드를 다 이해하기"가 아니라 **"이 쇼핑몰이 어떻게 움직이는지, 돈과 개인정보가 어디서 어떻게 지켜지는지"를 아는 것**입니다.
- 한 번에 다 읽을 필요는 없습니다. 1~6단계(약 2~3시간)만 읽어도 핵심은 파악됩니다.
- 파일은 VS Code 같은 편집기로 여세요. 이 문서의 파일 이름을 클릭하거나, 편집기에서 `Ctrl+P` 후 파일 이름을 입력하면 바로 열립니다.

---

## 0. 먼저 알아 둘 것: 주석 읽는 법

코드 안의 회색 글씨(주석)는 프로그램이 실행하지 않는 **설명문**입니다. 이 프로젝트에는 세 종류가 있습니다.

| 모양                                | 뜻                                                         | 읽는 법       |
| ----------------------------------- | ---------------------------------------------------------- | ------------- |
| `[쉬운 설명] …` (모든 파일 맨 위)   | 이 파일이 무슨 일을 하는지, 몇 단계에서 읽으면 되는지      | **꼭 읽기**   |
| `// ▶ …` 또는 `-- ▶ …`              | 바로 아래 코드가 무엇을 하는지 비개발자용으로 풀어 쓴 설명 | **꼭 읽기**   |
| 그 밖의 `//`, `/** … */`, `--` 주석 | 개발자용 메모(기술 용어가 섞여 있음)                       | 궁금하면 읽기 |

`[미확인]` 이 붙은 주석은 "실제 서비스에 연결해서 확인하지 못한 부분"입니다. `docs/SETUP_CHECKLIST.md` 에 모아 두었습니다.

### 코드에 자주 나오는 단어 10개

주석만 읽어도 되지만, 코드도 조금 읽어 보고 싶다면 이것만 알면 됩니다.

| 코드                           | 뜻                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `import … from "…"`            | 다른 파일의 기능을 가져다 쓰겠다는 선언. 파일 맨 위에 모여 있음 (건너뛰어도 됨) |
| `export`                       | 이 기능을 다른 파일에서도 쓸 수 있게 공개                                       |
| `function 이름(…) { … }`       | 하나의 작업 묶음(함수). `{ }` 안이 실제로 하는 일                               |
| `async` / `await`              | "시간이 걸리는 일(DB 조회, 토스 통신)을 기다렸다가 다음 줄로" 라는 뜻           |
| `if (조건) …`                  | 조건이 맞을 때만 실행. 예) `if (!session)` = 로그인 안 했으면                   |
| `return`                       | 작업을 끝내고 결과를 돌려줌                                                     |
| `throw new …Error(…)`          | 문제가 생겨 작업을 즉시 멈춤 (오류 발생)                                        |
| `try { … } catch { … }`        | 해 보고, 실패하면 catch 안의 대처를 실행                                        |
| `type …` / `: string`          | 데이터의 모양 설명(타입). 프로그램 동작에는 영향 없음 (건너뛰어도 됨)           |
| `<Button>…</Button>` 같은 태그 | 화면에 그릴 모양(JSX). HTML 과 비슷                                             |

`!` 는 "아니다", `===` 는 "같다", `!==` 는 "다르다", `&&` 는 "그리고", `||` 는 "또는" 입니다.

---

## 1. 전체 지도 한눈에 보기

```
사용자 브라우저
   │  ① 페이지 요청
   ▼
src/proxy.ts ............ 현관문: 언어(/ko, /en) 처리, 로그인 연장
   │
   ▼
src/app/[locale]/... .... 화면(페이지). 주소 하나 = 폴더 하나
   │  ② 버튼 클릭
   ▼
src/server/actions/ ..... 버튼을 누르면 실행되는 서버 코드 (입력 검사·권한 확인)
   │
   ▼
src/server/ ............. 핵심 규칙: 주문(orders.ts), 결제(payments/toss.ts), 로그인(auth.ts)
   │
   ▼
src/server/repo/ ........ 데이터 저장소: Supabase(실제 DB) 또는 메모리(데모)
   │
   ▼
supabase/migrations/ .... DB 설계도와 보안 규칙
```

폴더 이름 뜻:

- `src/app` — 화면과 서버 주소. 폴더 경로가 곧 웹 주소입니다. 예) `src/app/[locale]/cart/page.tsx` → `/ko/cart`
  - `[locale]`, `[slug]` 처럼 대괄호 폴더는 "그 자리에 값이 들어감"이라는 뜻 (`ko`/`en`, 상품 이름표 등)
  - `page.tsx` = 그 주소의 화면, `layout.tsx` = 공통 틀, `route.ts` = 화면 없는 서버 주소(API)
- `src/components` — 화면 부품(버튼, 카드, 양식). `ui/` 는 디자인 도구가 만든 기본 부품
- `src/server` — 서버에서만 실행되는 코드 (비밀 키를 쓰는 곳)
- `src/lib` — 화면과 서버가 함께 쓰는 규칙(가격, 입력 검사, 단어 사전)
- `messages` — 화면 문구 번역 (ko.json, en.json)
- `supabase` — DB 설계도(SQL)
- `tests` — 자동 검사
- `docs` — 문서

---

## 2. 리뷰 순서

각 단계마다 **목표 → 읽을 파일(순서대로) → 확인할 질문** 순으로 적었습니다. 파일 맨 위의 `[쉬운 설명]` 에도 단계 번호가 적혀 있습니다.

### 1단계. 프로젝트 소개와 설정 (15분)

목표: 이 프로젝트가 무엇이고 어떤 도구를 쓰는지 안다.

1. `README.md` — 실행 방법, 데모 모드, 화면 목록
2. `.env.example` — 어떤 외부 서비스를 쓰는지, 키가 없으면 어떻게 되는지
3. `package.json` — 사용하는 도구 목록과 명령어(`scripts`). 주석을 쓸 수 없는 형식이라 아래 "주석이 없는 파일" 참고
4. `next.config.ts` — 사이트 전체 설정, 보안 헤더

확인할 질문:

- [ ] 키 없이 실행하면 어떤 기능이 "데모"로 바뀌는가?
- [ ] 비밀 키와 공개해도 되는 키(`NEXT_PUBLIC_`)는 어떻게 구분되는가?

직접 해 보기: `pnpm dev` 를 실행하고 http://localhost:3000 을 둘러보세요. 코드를 읽기 전에 화면을 먼저 보면 훨씬 쉽습니다.

### 2단계. 기본 규칙: 단어·돈·입력 검사 (20분)

목표: 쇼핑몰의 "규칙"이 어디에 적혀 있는지 안다.

1. `src/lib/domain.ts` — 상품·주문·주문 상태 8가지의 정의 (단어 사전)
2. `src/lib/pricing.ts` — 배송비, 주문번호, 금액 계산
3. `src/lib/schemas.ts` — 이메일·우편번호·전화번호 검사 규칙
4. `src/env.ts`, `src/env.client.ts` — 설정값 검사, 토스 실서비스 키 거부

확인할 질문:

- [ ] 배송비 규칙(3만원 이상 무료)은 어디서 바꾸면 되는가? → `pricing.ts` 의 숫자 두 개
- [ ] 주문 상태는 어떤 순서로 바뀌는가? (결제 대기 → 결제 완료 → 배송중 → 배송 완료, 그 밖에 취소·반품·환불·자동 취소)

### 3단계. 화면 둘러보기 (30분)

목표: 사용자가 보는 화면이 어떤 파일인지 짝지을 수 있다.

1. `src/proxy.ts` — 모든 요청의 현관문
2. `src/app/[locale]/layout.tsx` — 공통 틀
3. `src/components/layout/site-header.tsx` → `user-menu.tsx` → `search-box.tsx` — 머리글
4. `src/app/[locale]/page.tsx` — 홈
5. `src/app/[locale]/products/page.tsx` → `products/[slug]/page.tsx` — 상품 목록·상세
6. `src/components/product/product-card.tsx` — 상품 카드
7. `messages/ko.json` — 화면 문구 (문구를 바꾸고 싶으면 여기)

확인할 질문:

- [ ] 브라우저에서 본 화면과 파일을 연결할 수 있는가?
- [ ] 화면 문구는 코드에 직접 적혀 있지 않고 번역 파일에 있다는 점 (관리자 화면만 예외: 한국어 전용)

`src/components/ui/` 폴더는 디자인 도구가 만든 기본 부품이라 건너뛰어도 됩니다.

### 4단계. 데이터는 어디에 저장되나 (30분)

목표: 데이터 저장 구조와 "데모 모드"의 원리를 안다.

1. `src/server/repo/types.ts` — 저장소가 지키는 약속 목록
2. `src/server/repo/index.ts` — 실제 DB / 메모리 DB 스위치
3. `src/server/repo/memory.ts` — 메모리 DB. `createOrder` 부분의 ▶ 주석(재고 처리 순서)을 꼭 읽기
4. `supabase/migrations/20261122000001_init.sql` — DB 설계도. ▶ 주석이 달린 표와 함수, 그리고 아래쪽 "보안 규칙(RLS)" 부분
5. `src/server/seed-data.ts` — 처음 들어 있는 상품 24개, 데모 계정
6. (가볍게) `src/server/repo/supabase.ts`, `src/server/supabase/clients.ts`

확인할 질문:

- [ ] 두 사람이 마지막 재고 1개를 동시에 사면 어떻게 되는가? → DB 함수가 잠그고 처리해 한 명만 성공
- [ ] 다른 사람의 주문이나 장바구니를 볼 수 없게 막는 규칙은 어디 있는가? → SQL 의 `create policy` 들
- [ ] 주문 상품의 가격을 왜 따로 복사해 두는가? → 나중에 상품 가격이 바뀌어도 영수증은 그대로

### 5단계. ★ 주문과 결제의 핵심 (40분)

목표: 돈이 어떻게 안전하게 처리되는지 이해한다. **가장 중요한 단계입니다.**

1. `src/server/auth.ts` — 로그인과 "지금 누구인가" 확인
2. `src/server/cart.ts` — 장바구니 가격을 서버가 다시 계산
3. `src/server/orders.ts` — ★ 주문의 일생. ▶ 주석을 위에서부터 차례로 읽으세요
4. `src/server/payments/toss.ts` — 토스와 통신, 모의 결제
5. `src/server/catalog.ts`, `src/server/revalidate.ts` — 상품 목록 캐시와 새로 고침

확인할 질문:

- [ ] 사용자가 주소창의 결제 금액을 1원으로 바꾸면? → `confirmOrderPayment` 의 "확인 3" 에서 거절
- [ ] 결제 완료 화면에서 새로고침을 여러 번 하면 두 번 결제되는가? → 아니오 (상태 확인 + 중복 방지 표식)
- [ ] 결제를 30분 넘게 미루면? → 주문 자동 취소, 재고 복구. 그 사이 결제가 승인되면 자동 환불
- [ ] 취소 요청이 두 번 가면 두 번 환불되는가? → 아니오 (idempotencyKey)

### 6단계. 버튼을 누르면 무슨 일이: 화면 → 서버 (40분)

목표: 실제 사용 흐름을 처음부터 끝까지 따라간다. 아래 "흐름 따라가기: 텀블러 하나 사기"를 보며 순서대로 여세요.

1. `src/components/product/add-to-cart.tsx` → `src/server/actions/cart.ts` — 담기
2. `src/stores/cart-store.ts`, `src/components/cart/cart-sync.tsx` — 장바구니 개수 표시
3. `src/app/[locale]/cart/page.tsx` → `src/components/cart/cart-view.tsx` — 장바구니
4. `src/components/auth/auth-form.tsx` → `src/server/actions/auth.ts` — 로그인 (장바구니 합치기)
5. `src/components/checkout/checkout-form.tsx` → `src/server/actions/orders.ts` — 배송지·주문 생성
6. `src/app/[locale]/checkout/pay/[orderNumber]/page.tsx` → `toss-payment.tsx` / `mock-payment.tsx` — 결제
7. `src/app/api/payments/toss/success/route.ts` — 결제 후 돌아오는 곳
8. `src/app/[locale]/checkout/success/page.tsx`, `fail/page.tsx` — 결과 화면
9. `src/app/[locale]/orders/[orderNumber]/page.tsx` → `src/components/order/order-actions.tsx` — 주문 상세·취소
10. `src/app/api/payments/toss/webhook/route.ts` — 토스의 알림(보조 안전망)
11. `src/server/actions/result.ts` — 성공/실패 결과 형식

확인할 질문:

- [ ] 모든 서버 액션이 "로그인 확인 → 입력 검사 → 실행" 순서를 지키는가?
- [ ] 오류가 났을 때 사용자에게는 무엇이 보이고, 내부 정보는 어디로 가는가? (`result.ts`)

### 7단계. 관리자 화면 (25분)

목표: 관리자만 할 수 있는 일과 그 보호 장치를 안다.

1. `src/server/admin-page.ts` — 관리자 페이지 문지기
2. `src/server/actions/admin.ts` — 관리자 버튼 (모두 첫 줄에서 권한 재확인)
3. `src/app/[locale]/admin/page.tsx` → `src/components/admin/new-order-listener.tsx` — 대시보드·새 주문 알림
4. `src/app/[locale]/admin/orders/...` → `src/components/admin/admin-order-actions.tsx` — 발송·반품 승인
5. `src/app/[locale]/admin/products/...` → `src/components/admin/product-form.tsx` → `image-uploader.tsx` — 상품 등록

확인할 질문:

- [ ] 일반 고객이 `/ko/admin` 주소를 직접 치면? → 홈으로 보내짐 (E2E 테스트로 검사함)
- [ ] 화면을 우회해 관리자 버튼의 서버 코드를 직접 부르면? → `requireAdmin()` 이 막음 + DB 보안 규칙이 한 번 더 막음

### 8단계. 부가 기능: 메일·분석·오류 추적·예약 작업 (20분)

1. `src/server/email.ts`, `src/emails/order-email.tsx` — 주문 메일
2. `src/server/redis.ts` — 요청 횟수 제한
3. `src/lib/analytics.ts`, `src/components/analytics.tsx`, `src/components/checkout/purchase-tracker.tsx` — GA4
4. `src/instrumentation.ts`, `src/instrumentation-client.ts` — Sentry(개인정보 걸러내기)
5. `src/app/api/` 의 `health`, `jobs/*`, `csp-report` — 상태 확인·예약 작업
6. `supabase/migrations/20261122000002_cron_queues.sql` — DB 예약 작업

### 9단계. 자동 검사와 배포 준비 (20분)

목표: 무엇이 자동으로 검사되는지 안다.

1. `tests/unit/*.test.ts` — 규칙 검사 20개. 테스트 이름(한국어)만 훑어도 무엇을 보장하는지 알 수 있음
2. `tests/e2e/shop.spec.ts` — 브라우저 자동 조작 검사 4개
3. `.github/workflows/ci.yml`, `keepalive.yml`, `.github/dependabot.yml` — GitHub 자동화
4. `docs/SETUP_CHECKLIST.md` — 실제 서비스 연결과 배포 순서

직접 해 보기: `pnpm test` 를 실행하면 20개 검사가 몇 초 만에 돌아갑니다.

---

## 3. 흐름 따라가기: 텀블러 하나 사기

손님이 텀블러를 사는 동안 실행되는 파일을 순서대로 적었습니다. 6단계에서 이 순서로 파일을 열어 보세요.

| 사용자 행동            | 실행되는 파일                                                                                                     | 일어나는 일                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 상품 상세 열기         | `proxy.ts` → `app/[locale]/products/[slug]/page.tsx` → `server/catalog.ts`                                        | 언어 확인, 상품 정보 읽기(캐시)                                   |
| "장바구니 담기" (손님) | `components/product/add-to-cart.tsx` → `stores/cart-store.ts`                                                     | 브라우저에 저장                                                   |
| 장바구니 보기          | `app/[locale]/cart/page.tsx` → `components/cart/cart-view.tsx` → `server/actions/cart.ts` → `server/cart.ts`      | 서버가 DB 가격으로 합계 계산                                      |
| 로그인                 | `components/auth/auth-form.tsx` → `server/actions/auth.ts` → `server/auth.ts`                                     | 비밀번호 확인, 손님 장바구니를 계정으로 합치기                    |
| 배송지 입력 → 주문     | `components/checkout/checkout-form.tsx` → `server/actions/orders.ts` → `server/orders.ts` (`placeOrder`)          | 가격 재계산, 재고 차감, "결제 대기" 주문 생성                     |
| 결제 화면              | `app/[locale]/checkout/pay/[orderNumber]/page.tsx` → `components/checkout/toss-payment.tsx`                       | 토스 위젯에 서버가 정한 금액 표시                                 |
| 결제 완료 후 돌아옴    | `app/api/payments/toss/success/route.ts` → `server/orders.ts` (`confirmOrderPayment`) → `server/payments/toss.ts` | 금액 대조 → 토스 최종 승인 → "결제 완료" → 장바구니 비우기 → 메일 |
| 결제 완료 화면         | `app/[locale]/checkout/success/page.tsx` → `components/checkout/purchase-tracker.tsx`                             | 주문번호 표시, GA4 구매 기록                                      |
| 주문 취소              | `components/order/order-actions.tsx` → `server/actions/orders.ts` → `server/orders.ts` (`cancelOrderByUser`)      | 토스 환불, 재고 복구, 취소 메일                                   |

---

## 4. 주석이 없는 파일

아래 파일은 형식상 주석을 쓸 수 없거나(JSON) 자동 생성되는 파일입니다.

| 파일                          | 무엇인가                                                                   |
| ----------------------------- | -------------------------------------------------------------------------- |
| `package.json`                | 프로젝트 이름, 사용하는 라이브러리 목록(`dependencies`), 명령어(`scripts`) |
| `pnpm-lock.yaml`              | 라이브러리의 정확한 버전 기록. 자동 생성, 읽지 않아도 됨                   |
| `tsconfig.json`               | TypeScript(타입 검사기) 설정                                               |
| `components.json`             | 디자인 부품 도구(shadcn/ui) 설정                                           |
| `messages/ko.json`, `en.json` | 화면 문구 번역. 문구 수정은 여기서                                         |
| `supabase/seed.sql`           | 데모 상품 SQL. `seed-data.ts` 에서 자동 생성 (맨 위에 안내 한 줄 있음)     |
| `public/products/*.svg`       | 상품 임시 그림. 자동 생성                                                  |
| `.prettierrc.json`            | 코드 줄 맞춤 도구 설정                                                     |
| `AGENTS.md`                   | AI 코딩 도구에게 주는 안내 (Next.js 가 자동으로 넣음)                      |

`src/types/supabase.ts` 는 Supabase 연결 후 `pnpm db:types` 를 실행하면 자동 생성본으로 통째로 바뀌어 맨 위 설명도 사라집니다. 정상입니다.

---

## 5. 용어집

| 용어                  | 쉬운 뜻                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| 서버 / 브라우저       | 서버 = 우리 컴퓨터(Vercel)에서 도는 코드, 사용자가 볼 수 없음. 브라우저 = 사용자 화면, 조작될 수 있음 |
| 서버 액션             | 화면의 버튼이 서버의 함수를 직접 부르는 방식 (`"use server"` 로 시작하는 파일)                        |
| 클라이언트 컴포넌트   | 브라우저에서 움직이는 화면 부품 (`"use client"` 로 시작하는 파일). 비밀 키를 쓸 수 없음               |
| API / route           | 화면 없이 데이터만 주고받는 서버 주소                                                                 |
| DB / 테이블 / 행      | 데이터베이스 = 엑셀 파일, 테이블 = 시트, 행 = 한 줄                                                   |
| RLS                   | Row Level Security. DB 가 "이 사람은 이 줄을 볼 수 있나"를 직접 판단하는 보안 규칙                    |
| 마이그레이션          | DB 설계도를 순서대로 적은 SQL 파일                                                                    |
| 캐시                  | 자주 쓰는 결과를 잠시 저장해 두고 빠르게 꺼내 쓰는 것                                                 |
| 세션 / 쿠키           | 로그인 상태를 기억하는 출입증 / 브라우저에 저장되는 작은 메모                                         |
| 웹훅                  | 다른 서비스(토스)가 "무슨 일이 생겼다"고 우리 서버에 알려 주는 것                                     |
| idempotency           | 같은 요청이 여러 번 와도 결과는 한 번만 일어나게 하는 성질                                            |
| 레이트 리밋           | 짧은 시간에 너무 많은 요청을 막는 장치                                                                |
| 환경변수              | 코드 밖에 두는 설정값·비밀 키 (`.env.local`, Vercel 설정)                                             |
| 데모 모드 / 모의 결제 | 외부 서비스 키 없이 흉내 내는 대체 동작                                                               |
| CSP                   | 우리가 허락한 곳의 스크립트만 실행되게 하는 브라우저 보안 규칙                                        |
| CI                    | 코드를 올릴 때마다 자동으로 검사하는 것                                                               |
| E2E 테스트            | 실제 브라우저를 자동 조작해 사용자처럼 처음부터 끝까지 써 보는 검사                                   |
| Zod                   | 입력값 검사 도구. `schemas.ts` 에 규칙이 모여 있음                                                    |
| Zustand               | 브라우저 쪽 상태(장바구니 개수 등) 보관 도구                                                          |
| Suspense              | "데이터를 기다리는 동안 회색 상자를 먼저 보여 주라"는 화면 장치                                       |

---

## 6. 리뷰하다가 궁금한 점이 생기면

- 파일 이름과 줄 번호를 적어 질문하면 가장 빨리 답할 수 있습니다. 예) "`src/server/orders.ts` 60번째 줄은 왜 필요해?"
- 화면 문구, 배송비, 결제 대기 시간(30분) 같은 숫자는 코드 몇 줄만 바꾸면 되는 경우가 많습니다. 바꾸고 싶은 것이 있으면 말씀해 주세요.
