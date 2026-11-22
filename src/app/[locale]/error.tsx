/**
 * [쉬운 설명] 페이지에서 예상치 못한 오류가 났을 때 보여 주는 화면('다시 시도' 버튼).
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-light tracking-tight">{t("errorTitle")}</h1>
      {error.digest ? <p className="text-xs text-muted-foreground">ref: {error.digest}</p> : null}
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
