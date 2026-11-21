/**
 * [쉬운 설명] 없는 주소로 들어왔을 때 보여 주는 404 화면.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
      <Link href="/" className="text-primary underline">
        chanhee-mall
      </Link>
    </div>
  );
}
