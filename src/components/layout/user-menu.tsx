/**
 * [쉬운 설명] 머리글의 사용자 메뉴. 로그인 여부·관리자 여부에 따라 보여 주는 링크가 달라집니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { getTranslations } from "next-intl/server";
import { LogoutButton } from "@/components/layout/logout-button";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/auth";

export async function UserMenu({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const session = await getSession();
  if (!session) {
    return (
      <Link href="/login" className="rounded-md px-2 py-1 hover:bg-muted">
        {t("login")}
      </Link>
    );
  }
  return (
    <>
      {session.role === "admin" ? (
        <Link href="/admin" className="rounded-md px-2 py-1 font-medium text-primary hover:bg-muted">
          {t("admin")}
        </Link>
      ) : null}
      <Link href="/orders" className="rounded-md px-2 py-1 hover:bg-muted">
        {t("orders")}
      </Link>
      <LogoutButton label={t("logout")} />
    </>
  );
}
