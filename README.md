# chanhee-mall

바쁜 직장인을 위한 생활용품 쇼핑몰 MVP입니다. 바이브 코딩 학습용 프로젝트이며, 실제 판매는 하지 않습니다(데모 배너 표시, 토스 테스트 결제만 사용).

- 기획서(PRD): https://claude.ai/artifact/645KBGhbEcs2YX8HoDu7Et
- 기술 스택 결정 기록: https://claude.ai/artifact/Rt36HF15DgX7QtmySApJMZ
- **코드 리뷰 순서 안내(비개발자용): [docs/REVIEW_GUIDE.md](docs/REVIEW_GUIDE.md)**
- **가입·키 발급·배포 체크리스트: [docs/SETUP_CHECKLIST.md](docs/SETUP_CHECKLIST.md)** ← 다음에 할 일

## 지금 바로 실행해 보기 (가입 없이)

외부 서비스 키가 하나도 없어도 "데모 모드"로 전부 동작합니다.

```bash
pnpm install
pnpm dev
# http://localhost:3000 → 자동으로 /ko 로 이동
```

데모 모드에서는:

| 기능   | 키가 없을 때                                             | 키를 넣으면                       |
| ------ | -------------------------------------------------------- | --------------------------------- |
| 데이터 | 메모리 DB (상품 24개, **서버를 껐다 켜면 초기화**)       | Supabase Postgres                 |
| 로그인 | 서명된 쿠키 + 데모 계정 2개                              | Supabase Auth                     |
| 결제   | "모의 결제" 버튼 → 서버 검증 로직은 실제와 동일하게 통과 | 토스페이먼츠 결제위젯(테스트)     |
| 메일   | 서버 콘솔에 출력                                         | Resend                            |
| 제한   | 서버 메모리로 레이트 리밋                                | Upstash Redis                     |
| 이미지 | 관리자에서 이미지 주소 직접 입력                         | Supabase Storage(tus 이어 올리기) |
| 알림   | 관리자 대시보드 30초마다 새로고침                        | Supabase Realtime                 |

데모 계정은 로그인 화면 아래 "이 계정으로 채우기" 버튼으로 바로 쓸 수 있습니다(관리자 1개, 고객 1개, `src/server/seed-data.ts`).

## 주요 화면

- 쇼핑: `/ko`(홈), `/ko/products`(목록·카테고리·검색), `/ko/products/[slug]`(상세·옵션), `/ko/cart`
- 주문: `/ko/checkout`(배송지·다음 우편번호) → `/ko/checkout/pay/[주문번호]`(결제) → 성공/실패 → `/ko/orders`
- 관리자(한국어 전용): `/ko/admin`(매출·최근 주문·실시간 알림), `/ko/admin/products`, `/ko/admin/orders`
- 영어: 주소의 `/ko` 를 `/en` 으로 (헤더의 언어 버튼)

## 명령어

| 명령                       | 하는 일                                                               |
| -------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                 | 개발 서버                                                             |
| `pnpm build && pnpm start` | 운영 빌드로 실행                                                      |
| `pnpm lint`                | ESLint                                                                |
| `pnpm format`              | Prettier 로 코드 정리                                                 |
| `pnpm typecheck`           | 라우트 타입 생성 + TypeScript 검사                                    |
| `pnpm test`                | 단위 테스트 (Vitest)                                                  |
| `pnpm test:e2e`            | E2E 테스트 (Playwright, 빌드 후 데모 모드로 실행, 설치된 Chrome 사용) |
| `pnpm db:push`             | Supabase 에 마이그레이션 적용 (Supabase CLI 필요)                     |
| `pnpm db:types`            | Supabase 스키마로 TypeScript 타입 재생성                              |
| `pnpm db:demo-users`       | Supabase 에 데모 계정 2개 생성                                        |
| `pnpm db:seed-sql`         | `seed-data.ts` → `supabase/seed.sql` 다시 만들기                      |
| `pnpm audit:ci`            | 운영 의존성 보안 감사                                                 |

## 구조

```
src/
  app/[locale]/        화면 (ko/en). admin/ 은 관리자
  app/api/             결제 성공 리다이렉트, 토스 웹훅, 예약 작업, 상태 확인, CSP 보고
  components/          UI (shadcn/ui 는 components/ui)
  server/              서버 전용 로직
    repo/              저장소: supabase.ts(실제) / memory.ts(데모) — 같은 인터페이스
    actions/           서버 액션 (모든 입력은 Zod 로 다시 검사, 관리자 액션은 requireAdmin)
    orders.ts          주문·결제 승인·취소·반품 규칙
    payments/toss.ts   토스 API (키 없으면 모의 모드)
  lib/                 가격 규칙, 검증 스키마, 타입
  stores/              Zustand (DB 장바구니의 화면용 사본)
supabase/migrations/   테이블·RLS·재고 함수·예약 작업 SQL
messages/              번역 (ko.json, en.json)
tests/unit, tests/e2e  테스트
```

## 안전장치 요약

- 결제 금액은 브라우저 값을 믿지 않고 서버가 DB 가격으로 다시 계산해 토스 승인 전에 비교
- 결제 승인은 한 번만 반영(중복 승인 방지), 30분 지난 결제 대기 주문은 자동 취소 + 재고 복구
- 토스 웹훅은 본문을 믿지 않고 토스 API 로 결제 상태를 다시 조회
- Supabase RLS + 서버 권한 검사 이중 방어, 비밀 키는 `server-only` 모듈에서만 사용
- 토스 키는 `test_` 로 시작하지 않으면 앱이 시작되지 않음
- 보안 헤더 + CSP(처음엔 보고만), 로그인·결제·검색 레이트 리밋
