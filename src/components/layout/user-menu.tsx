/**
 * [쉬운 설명] 머리글의 사용자 메뉴. 로그인 여부·관리자 여부에 따라 보여 주는 링크가 달라집니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { ReceiptText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LogoutButton } from "@/components/layout/logout-button";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/auth";

export async function UserMenu({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const session = await getSession();
  if (!session) {
    return (
      <Link href="/login" className="rounded-full px-2.5 py-1.5 hover:bg-secondary">
        {t("login")}
      </Link>
    );
  }
  return (
    <>
      {session.role === "admin" ? (
        <Link href="/admin" className="rounded-full px-2.5 py-1.5 font-medium text-primary hover:bg-secondary">
          {t("admin")}
        </Link>
      ) : null}
      {/* ▶ 휴대폰에서는 아이콘만, 넓은 화면에서는 글자로 */}
      <Link
        href="/orders"
        className="grid size-9 place-items-center rounded-full hover:bg-secondary sm:flex sm:size-auto sm:px-2.5 sm:py-1.5"
        aria-label={t("orders")}
      >
        <ReceiptText className="size-[18px] sm:hidden" />
        <span className="hidden sm:inline">{t("orders")}</span>
      </Link>
      <LogoutButton label={t("logout")} />
    </>
  );
}
