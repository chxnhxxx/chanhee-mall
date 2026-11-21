import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * 필수 정보 페이지 (PRD P0). 학습용 데모의 예시 문안이며 법률 검토를 받지 않았습니다.
 */
const DOCS = ["terms", "privacy", "refund"] as const;
type Doc = (typeof DOCS)[number];

const BODY: Record<Doc, { ko: string[]; en: string[] }> = {
  terms: {
    ko: [
      "제1조 (목적) 이 약관은 chanhee-mall(이하 '사이트')이 제공하는 데모 쇼핑 서비스의 이용 조건을 정합니다.",
      "제2조 (데모 서비스) 사이트는 학습용 데모이며 실제 상품 판매·결제·배송을 하지 않습니다. 결제는 PG사 테스트 모드로만 처리됩니다.",
      "제3조 (계정) 이용자는 데모 테스트 계정 사용을 권장받으며, 실제 개인정보 입력을 삼가야 합니다.",
      "제4조 (면책) 사이트는 데모 데이터의 정확성을 보장하지 않으며, 예고 없이 데이터를 초기화할 수 있습니다.",
    ],
    en: [
      "1. Purpose. These terms govern use of the chanhee-mall demo shopping service (the 'Site').",
      "2. Demo service. The Site is a learning demo. It does not sell, charge for, or ship real products. Payments run only in the payment provider's test mode.",
      "3. Accounts. Please use the demo test accounts and avoid entering real personal data.",
      "4. Disclaimer. Demo data may be inaccurate and may be reset without notice.",
    ],
  },
  privacy: {
    ko: [
      "수집 항목: 이메일, 이름(회원가입 시), 배송지·연락처(주문 시). 데모 목적상 실제 정보 대신 테스트 값을 입력해 주세요.",
      "이용 목적: 로그인, 주문 처리 시연, 주문 알림 메일 발송.",
      "보관 기간: 데모 데이터는 수시로 초기화되며, 탈퇴 요청 시 즉시 삭제합니다.",
      "처리 위탁·외부 서비스: Supabase(DB·인증), Vercel(호스팅), 토스페이먼츠(테스트 결제), Resend(메일), Sentry(오류 수집, 개인정보 제거 설정), Google Analytics 4(방문 통계, 개인정보를 이벤트에 넣지 않음), Upstash(요청 제한).",
      "쿠키: 로그인 유지와 방문 통계에 쿠키를 사용합니다.",
    ],
    en: [
      "Data collected: email and name (sign-up), shipping address and phone (orders). Please enter test values, not real data.",
      "Purpose: login, demonstrating order processing, order notification emails.",
      "Retention: demo data is reset regularly and deleted immediately on request.",
      "Processors: Supabase (database, auth), Vercel (hosting), Toss Payments (test payments), Resend (email), Sentry (error tracking, PII scrubbed), Google Analytics 4 (analytics, no PII in events), Upstash (rate limiting).",
      "Cookies: used to keep you logged in and for analytics.",
    ],
  },
  refund: {
    ko: [
      "발송 전: 주문 상세 화면에서 바로 취소할 수 있으며, 결제가 즉시 취소(환불)됩니다.",
      "발송 후: 주문 상세에서 반품을 요청하면 운영자 승인 후 환불됩니다.",
      "결제 대기 주문은 30분 안에 결제하지 않으면 자동 취소되고 재고가 복구됩니다.",
      "실제 판매 시에는 전자상거래법상 청약철회 기간(일반적으로 수령 후 7일)과 예외를 명시해야 합니다 [미확인: 법령 원문 확인 필요].",
    ],
    en: [
      "Before shipping: cancel from the order page for an immediate refund.",
      "After shipping: request a return from the order page; refunds are issued after admin approval.",
      "Unpaid orders are cancelled automatically after 30 minutes and stock is restored.",
      "A real store must state the statutory withdrawal period and exceptions (unverified: check the law).",
    ],
  },
};

export async function generateMetadata({ params }: PageProps<"/[locale]/legal/[doc]">): Promise<Metadata> {
  const { locale, doc } = await params;
  if (!DOCS.includes(doc as Doc)) return {};
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t(`${doc as Doc}Title`) };
}

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }));
}

export default async function LegalPage({ params }: PageProps<"/[locale]/legal/[doc]">) {
  const { locale, doc } = await params;
  setRequestLocale(locale);
  if (!DOCS.includes(doc as Doc)) notFound();
  const t = await getTranslations({ locale, namespace: "legal" });
  const body = BODY[doc as Doc][locale === "en" ? "en" : "ko"];
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">{t(`${doc as Doc}Title`)}</h1>
      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">{t("draftNotice")}</p>
      {body.map((p) => (
        <p key={p} className="leading-relaxed">
          {p}
        </p>
      ))}
    </article>
  );
}
