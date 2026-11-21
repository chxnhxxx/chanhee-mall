/**
 * [쉬운 설명] 결제 실패 화면. 실패 이유를 알려 주고 다시 결제할 수 있게 합니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const KNOWN_CODES = new Set([
  "AMOUNT_MISMATCH",
  "TOSS_ERROR",
  "INVALID_STATE",
  "NOT_FOUND",
  "FORBIDDEN",
  "RATE_LIMITED",
]);

export default async function FailPage({ params, searchParams }: PageProps<"/[locale]/checkout/fail">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={null}>
      <FailContent locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

async function FailContent({
  locale,
  searchParams,
}: {
  locale: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "result" });
  const te = await getTranslations({ locale, namespace: "errors" });
  const code = typeof sp.code === "string" ? sp.code : "";
  // 토스가 직접 보낸 실패(사용자 취소 등)는 message 가 함께 옴. 화면에는 우리 문구만 보여줌
  const orderId = typeof sp.orderId === "string" && /^[A-Za-z0-9_-]{6,64}$/.test(sp.orderId) ? sp.orderId : undefined;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t("failTitle")}</h1>
      <p className="text-muted-foreground">{KNOWN_CODES.has(code) ? te(code as never) : t("failBody")}</p>
      <div className="flex gap-2">
        {orderId ? (
          <Button asChild>
            <Link href={`/checkout/pay/${orderId}`}>{t("retry")}</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/orders">{t("viewOrder")}</Link>
        </Button>
      </div>
    </div>
  );
}
