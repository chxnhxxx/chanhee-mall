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
