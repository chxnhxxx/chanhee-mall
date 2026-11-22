/**
 * [쉬운 설명] 화면 맨 위 '데모 사이트입니다' 안내 띠.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { getTranslations } from "next-intl/server";

export async function DemoBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "demo" });
  return (
    <div
      role="note"
      className="border-b border-border bg-secondary px-4 py-1.5 text-center text-[11px] leading-snug text-muted-foreground"
    >
      {t("banner")}
    </div>
  );
}
