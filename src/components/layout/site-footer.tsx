/**
 * [쉬운 설명] 바닥글: 이용약관·개인정보처리방침·환불정책 링크.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "footer" });
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 chanhee-mall · {t("business")}</p>
        <nav className="flex gap-4">
          <Link href="/legal/terms" className="hover:text-foreground">
            {t("terms")}
          </Link>
          <Link href="/legal/privacy" className="font-semibold hover:text-foreground">
            {t("privacy")}
          </Link>
          <Link href="/legal/refund" className="hover:text-foreground">
            {t("refund")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
