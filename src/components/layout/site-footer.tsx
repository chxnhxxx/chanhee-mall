/**
 * [쉬운 설명] 바닥글: 이용약관·개인정보처리방침·환불정책 링크.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium tracking-tight text-ink">chanhee-mall</p>
          <p>{t("business")}</p>
          <p>© 2026 chanhee-mall</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/legal/terms" className="hover:text-ink">
            {t("terms")}
          </Link>
          <Link href="/legal/privacy" className="font-medium text-ink underline-offset-4 hover:underline">
            {t("privacy")}
          </Link>
          <Link href="/legal/refund" className="hover:text-ink">
            {t("refund")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
