import { getTranslations } from "next-intl/server";

export async function DemoBanner({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "demo" });
  return (
    <div role="note" className="bg-amber-100 px-4 py-2 text-center text-xs text-amber-900">
      {t("banner")}
    </div>
  );
}
