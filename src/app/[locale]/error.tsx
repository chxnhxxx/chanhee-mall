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
      <h1 className="text-2xl font-bold">{t("errorTitle")}</h1>
      {error.digest ? <p className="text-xs text-muted-foreground">ref: {error.digest}</p> : null}
      <Button onClick={reset}>{t("retry")}</Button>
    </div>
  );
}
