# 가입·연동·배포 체크리스트

코드는 외부 서비스 없이도 "데모 모드"로 전부 동작하도록 만들어 두었습니다. 이 문서는 **실제 서비스를 하나씩 붙이고 배포할 때** 해야 할 일을 순서대로 모은 것입니다.

- 각 단계는 독립적입니다. 하나만 붙여도 나머지는 데모 모드로 계속 동작합니다.
- 키는 전부 `.env.local`(로컬)과 Vercel 환경변수(배포)에만 넣습니다. git 에 올리지 마세요.
- **[미확인]** 표시는 제가 공식 문서나 실제 계정으로 확인하지 못한 부분입니다. 해당 단계에서 직접 확인이 필요합니다.

권장 순서: 0 → 1(GitHub) → 2(Supabase) → 3(토스) → 9(Vercel 배포) → 나머지는 아무 때나

---

## 0. 로컬 준비

- [ ] **Node 26 설치.** 스택 결정은 Node 26 이지만, 지금 이 PC 에는 Node 24.22.1 이 깔려 있어 그걸로 개발·검증했습니다. `.nvmrc` 는 26 입니다.
  - 설치 후 `node --version` 으로 확인 → `pnpm install` → `pnpm test` 다시 실행
- [ ] **pnpm** 은 `package.json` 의 `packageManager`(pnpm@12.21.0)를 Corepack 이 맞춰 줍니다: `corepack enable`
- [ ] `.env.example` 을 복사해 `.env.local` 만들기, `SESSION_SECRET` 채우기
  ```
  node -e "console.log(crypto.randomBytes(32).toString('hex'))"
  ```

## 1. GitHub 저장소

- [ ] github.com 에서 새 **private** 저장소 만들기 (예: `chanhee-mall`)
- [ ] 로컬 커밋 올리기
  ```
  git remote add origin https://github.com/<아이디>/chanhee-mall.git
  git push -u origin main
  ```
  (현재 브랜치 이름이 `master` 라면 `git branch -M main` 먼저)
- [ ] Settings → Code security → **Dependabot alerts / security updates** 켜기 (`.github/dependabot.yml` 은 이미 있음)
- [ ] Actions 탭에서 **CI** 가 초록불인지 확인 (린트·타입·단위 테스트·빌드·E2E·보안 감사)
  - [미확인] private 저장소의 무료 Actions 분량(월 몇 분)은 계정 플랜에 따라 다름. CI 1회 약 5~8분 예상
  - [미확인] 액션은 `@v4` 같은 메이저 태그로 적었습니다. 더 엄격히 하려면 커밋 SHA 로 고정
- [ ] 배포 후(9단계) Settings → Secrets and variables → Actions 에 **`SITE_URL`** 추가 → 매일 깨우기 핑(`keepalive.yml`)이 동작

## 2. Supabase (DB·로그인·이미지·실시간)

- [ ] supabase.com 가입 → New project (리전: **Northeast Asia (Seoul)**), DB 비밀번호는 비밀번호 관리자에 저장
- [ ] **Authentication → Sign In / Providers → Email → "Confirm email" 끄기** (스택 결정: 메일 인증 없음. 안 끄면 가입 직후 로그인이 안 됨)
- [ ] Project Settings → API Keys 에서 `.env.local` 에 넣기
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`(sb_publishable_…), `SUPABASE_SECRET_KEY`(sb_secret_…)
  - 세 값이 다 있으면 자동으로 Supabase 모드가 됩니다(`DATA_BACKEND=auto`)
- [ ] **Supabase CLI 준비.** devDependency 로 설치는 했지만 이 PC 에서 CLI 실행 파일이 내려받아지지 않았습니다(`node_modules/supabase/bin` 없음). 다음 중 하나:
  - `pnpm rebuild supabase` 다시 시도, 또는
  - Windows: `scoop install supabase` (공식 안내 방식)
- [ ] 프로젝트 연결 후 테이블 만들기
  ```
  pnpm exec supabase login
  pnpm exec supabase link --project-ref <프로젝트ID>
  pnpm db:push
  ```
  - [미확인] `supabase/config.toml` 이 없어서 link 전에 `supabase init` 을 요구할 수 있습니다. 요구하면 실행하세요(기존 migrations 폴더는 그대로 씀)
  - 대안: 대시보드 SQL Editor 에 `supabase/migrations/` 의 두 파일을 순서대로 붙여넣고 실행
- [ ] 상품 데이터 넣기: SQL Editor 에 `supabase/seed.sql` 붙여넣고 실행
- [ ] 데모 계정 2개 만들기: `pnpm db:demo-users` (관리자 계정은 profiles.role 을 admin 으로 바꿔 줌)
- [ ] 타입 다시 만들기: `pnpm db:types` → `src/types/supabase.ts` 가 실제 스키마로 바뀜 → `pnpm typecheck`
  - 지금 파일은 제가 손으로 쓴 것이라 실제와 다를 수 있습니다
- [ ] `pnpm dev` → 로그인·장바구니·주문이 Supabase 에 저장되는지 확인 (Table Editor 에서 orders 확인)
- [ ] 이미지 업로드 확인: 관리자 → 상품 수정 → 파일 선택
  - [미확인] 무료 플랜에서 tus(이어 올리기) 업로드 지원 여부. 안 되면 "이미지 주소" 입력으로 대체 가능
  - 업로드한 이미지가 안 보이면 `next.config.ts` 의 `images.remotePatterns` 확인
- [ ] 실시간 알림 확인: 관리자 대시보드를 열어 둔 채 다른 브라우저에서 주문 → "새 주문" 알림
  - [미확인] Realtime 구독에도 RLS 가 적용되어 관리자만 받는지 (고객 계정으로 구독해 보고 다른 사람 주문이 안 오는지 확인 권장)
- [ ] **예약 작업(pg_cron)·큐(pgmq)** — 두 번째 마이그레이션이 켭니다
  - [미확인] 무료 플랜에서 pg_cron / pgmq 사용 가능 여부. 마이그레이션이 실패하면 Database → Extensions 에서 켤 수 있는지 확인
  - 5분마다 만료 주문 정리(`expire-pending-orders`)는 SQL 만으로 동작
  - 메일 재시도(10분마다 `/api/jobs/email-retry` 호출)는 pg_net + Vault 가 필요해 **주석 처리**해 두었습니다. 배포 후 마이그레이션 파일 맨 아래 주석의 안내대로 Vault 에 `site_url`, `cron_secret` 을 넣고 실행
  - 대안(스택 결정의 예비안): Upstash QStash 로 같은 API 호출
- [ ] 7일 무활동 일시정지 방지: 1단계의 `SITE_URL` 시크릿 설정으로 해결 (매일 `/api/health` 가 DB 를 한 번 읽음)
  - [미확인] Supabase 가 무엇을 "활동"으로 세는지 공식 기준

## 3. 토스페이먼츠 (결제, 테스트 모드만)

- [ ] developers.tosspayments.com 가입 (사업자 없이 테스트 키 발급 가능)
- [ ] 개발자센터 → API 키 → **결제위젯 연동 키**(test_gck_… / test_gsk_…)를 `.env.local` 에
  - `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`
  - `test_` 로 시작하지 않으면 앱이 일부러 시작을 거부합니다(실키 실수 방지)
  - [미확인] 결제위젯 v2 SDK(2.10.0)에서 "API 개별 연동 키"가 아닌 "결제위젯 연동 키"가 필요한 점은 공식 문서 기준이나, 키 이름은 콘솔에서 확인
- [ ] `pnpm dev` → 주문 → 결제 화면에 토스 위젯이 뜨는지 → 테스트 카드로 결제 → 성공 화면 → 관리자에서 결제 완료 확인
- [ ] 결제위젯 어드민에서 결제수단 UI(variantKey "DEFAULT") 확인
- [ ] **웹훅 등록** (배포 후): 개발자센터 → 웹훅 → `https://<사이트>/api/payments/toss/webhook`, 이벤트 `PAYMENT_STATUS_CHANGED`
  - [미확인] 테스트 모드에서도 웹훅이 실제로 발송되는지. 안 와도 결제 흐름은 성공 리다이렉트로 완료됩니다(웹훅은 보조 안전망)
  - 웹훅 본문은 믿지 않고 토스 API 로 상태를 다시 조회하므로 별도 서명 검증은 없습니다
- [ ] [미확인] 토스 결제창을 Playwright 로 자동화하는 것은 하지 않았습니다. E2E 는 모의 결제로 검사합니다

## 4. Resend (주문 확인 메일)

- [ ] resend.com 가입 → API Keys → `RESEND_API_KEY`
- [ ] `EMAIL_FROM=chanhee-mall <onboarding@resend.dev>`, `EMAIL_DEV_REDIRECT_TO=<가입한 본인 메일>`
  - [미확인] 도메인 인증 전에는 가입한 본인 주소로만 보낼 수 있다고 알려져 있어, 모든 메일을 `EMAIL_DEV_REDIRECT_TO` 로 돌려보내게 해 두었습니다
- [ ] (선택) 도메인이 생기면 Domains 에서 인증 → `EMAIL_FROM` 바꾸고 `EMAIL_DEV_REDIRECT_TO` 비우기
- [ ] 결제 완료 후 메일 도착 확인. 실패한 메일은 pgmq 큐에 쌓였다가 재시도(2단계 예약 작업 설정 필요)

## 5. Upstash Redis (레이트 리밋·캐시)

- [ ] upstash.com 가입 → Redis 데이터베이스 생성(리전: 서울에 가까운 곳, 예: ap-northeast-1)
- [ ] REST API 의 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - [미확인] 무료 한도(일 요청 수 등)는 현재 요금표 확인
- [ ] 로그인 연속 실패 시 "요청이 너무 많습니다"가 뜨는지 확인

## 6. Sentry (에러 추적)

- [ ] sentry.io 가입 → 프로젝트 생성(Next.js) → `NEXT_PUBLIC_SENTRY_DSN`
- [ ] 소스맵 업로드용(Vercel 에만): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
  - [미확인] @sentry/nextjs 11.16 의 Next 16.4 공식 지원 범위. 빌드는 통과했지만 실제 이벤트 전송은 키를 넣고 확인 필요
- [ ] 개인정보 보호: 요청 본문·쿠키·사용자 이메일은 보내지 않도록 이미 걸러 둠

## 7. GA4 (방문·구매 분석)

- [ ] analytics.google.com → 속성 만들기 → 웹 스트림 → 측정 ID(G-…) → `NEXT_PUBLIC_GA_ID`
- [ ] 결제 완료 시 `purchase` 이벤트가 실시간 보고서에 보이는지 확인

## 8. 운영 비밀값

- [ ] `CRON_SECRET`: 32자 이상 무작위 (0단계 명령으로 생성). 예약 작업 API 호출에 사용
- [ ] `SESSION_SECRET`: Supabase 모드에서는 안 쓰지만 데모 모드로 배포할 때 필수

## 9. Vercel 배포

- [ ] vercel.com 에 GitHub 로 가입 → Add New Project → 1단계 저장소 선택 (Framework: Next.js 자동 인식)
- [ ] Settings → General → **Node.js Version 26.x**
  - [미확인] Vercel 이 Node 26 을 지금 지원하는지. 없으면 24.x 로 두세요(코드는 24 에서 검증됨)
- [ ] Settings → Environment Variables 에 `.env.local` 값 전부 + `NEXT_PUBLIC_SITE_URL=https://<배포 주소>`
  - `DISABLE_RATE_LIMIT` 은 넣지 마세요
- [ ] 배포 → `https://<배포 주소>/api/health` 가 `{"ok":true,"backend":"supabase"}` 인지 확인
- [ ] 1단계 `SITE_URL` 시크릿, 3단계 토스 웹훅, 2단계 메일 재시도 예약 작업 설정
- [ ] main 에 푸시하면 자동 배포(CD), PR 마다 미리보기 배포
- [ ] [미확인] Vercel Hobby 는 개인·비상업용 조건입니다. 학습용 데모로만 쓰세요

## 10. 배포 후 보안 마무리

- [ ] **CSP 를 "보고만" → "실제 차단"으로 전환**: 며칠 써 보며 Vercel 로그에서 `[csp-report]` 위반이 없으면 `CSP_ENFORCE=1`
  - 위반이 있으면 `next.config.ts` 의 허용 목록에 해당 주소 추가
  - [미확인] Next.js 와 토스·다음 우편번호 스크립트가 `'unsafe-inline'` 없이 동작하는지. 지금은 script-src 에 `'unsafe-inline'` 을 허용해 둠(nonce 방식은 정적 미리 렌더를 포기해야 함)
- [ ] [미확인] Vercel 이 HSTS 를 자체적으로 붙이는지. 앱에서도 `Strict-Transport-Security` 를 보냄
- [ ] Supabase → Advisors(Security/Performance) 경고 확인
- [ ] 관리자 데모 계정 비밀번호는 공개되어 있으니(데모용), 실제 데이터를 넣는다면 반드시 바꾸고 로그인 화면의 데모 안내를 끄세요(`src/app/[locale]/login/page.tsx`)

---

## 확인하지 못한 기술 사항 모음 [미확인]

스택 결정 문서의 [미확인] 항목과 구현 중 생긴 항목입니다.

| 항목                                                   | 현재 처리                                        | 확인 방법         |
| ------------------------------------------------------ | ------------------------------------------------ | ----------------- |
| pnpm 12 의 `minimumReleaseAge`·`allowBuilds` 설정 이름 | `pnpm-workspace.yaml` 에 적용, 설치 시 경고 없음 | pnpm 공식 문서    |
| Zustand 5.1                                            | 설치·동작 확인                                   | -                 |
| Postgres 메이저 버전                                   | 특정 버전 기능 안 씀                             | Supabase 대시보드 |
| Supabase 무료 플랜 tus 업로드                          | 코드 완료, 주소 입력 대체 있음                   | 2단계             |
| Supabase 무료 플랜 pg_cron·pgmq·pg_net                 | 마이그레이션 작성                                | 2단계             |
| Realtime 에 RLS 적용                                   | 관리자만 전체 주문 보이게 정책 작성              | 2단계             |
| `products` 검색이 trgm 인덱스를 타는지                 | `name_ko`·`name_en` 각각 ILIKE                   | `explain analyze` |
| 토스 SDK 2.10.0 / 테스트 웹훅 / 결제창 자동화          | 모의 결제로 E2E                                  | 3단계             |
| 다음 우편번호: 키 없이 사용                            | 키 없이 연동                                     | 배포 후 확인      |
| Resend 도메인 없이 발송 범위                           | 본인 주소로 돌려보내기                           | 4단계             |
| Sentry 11 ↔ Next 16.4                                  | 빌드 통과                                        | 6단계             |
| Upstash 무료 한도                                      | 메모리 대체 있음                                 | 5단계             |
| ESLint 10                                              | Next 기본 설정 그대로, 린트 통과                 | -                 |
| next-intl 4.15 ↔ Next 16.4                             | 빌드·E2E 통과                                    | -                 |
| GitHub Actions 무료 분량·SHA 고정                      | 메이저 태그                                      | 1단계             |
| `unsafe-inline`·Vercel HSTS                            | Report-Only 로 시작                              | 10단계            |
| React 버전                                             | 스택 문서는 19.2, Next 16.4.6 기본 설치는 19.3.0 | 문제 없으면 유지  |
| Node 26                                                | 로컬은 24.22.1 로 검증                           | 0·9단계           |

## 이미 검증한 것 (데모 모드, 로컬)

- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm build` 통과
- 단위 테스트 20개: 가격·배송비, 입력 검증, 재고 차감/부족/전부-아니면-전무, 중복 결제 방지, 취소·만료 시 재고 복구, 번역 키 일치, 환경변수(실키 거부)
- E2E 4개: 손님 담기 → 로그인(장바구니 합치기) → 배송지 → 모의 결제 → 성공 → 주문 취소 / 관리자 송장 입력 → 배송중 / 고객의 관리자 화면 접근 차단 / 영어 화면 검색
