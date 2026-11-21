/**
 * [쉬운 설명] 로그인·회원가입 입력 양식. 입력값을 먼저 화면에서 검사하고, 통과하면 서버로 보냅니다.
 * 리뷰 순서: 5단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { loginSchema, signupSchema } from "@/lib/schemas";
import { type AuthFormState, loginAction, signupAction } from "@/server/actions/auth";
import { useCartStore } from "@/stores/cart-store";

type Mode = "login" | "signup";
type Values = { name?: string; email: string; password: string };

export function AuthForm({
  mode,
  next,
  demoAccounts,
}: {
  mode: Mode;
  next?: string;
  demoAccounts?: { email: string; password: string; label: string }[];
}) {
  const t = useTranslations("auth");
  const tv = useTranslations("validation");
  const locale = useLocale();
  const router = useRouter();
  const guestLines = useCartStore((s) => s.guestLines);
  const clearGuest = useCartStore((s) => s.clearGuest);
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    mode === "login" ? loginAction : signupAction,
    null,
  );

  const form = useForm<Values>({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema) as never,
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (state?.ok && state.redirectTo) {
      clearGuest();
      window.location.assign(state.redirectTo); // 세션 쿠키가 반영된 상태로 새로 그림
    }
  }, [state, clearGuest, router]);

  const onValid = (values: Values) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(values)) if (v !== undefined) fd.set(k, v);
    fd.set("guestCart", JSON.stringify(guestLines));
    fd.set("locale", locale);
    if (next) fd.set("next", next);
    startTransition(() => formAction(fd));
  };

  const err = (key?: string) => (key ? tv(key as never) : null);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-5 py-8">
      <h1 className="text-2xl font-bold">{mode === "login" ? t("loginTitle") : t("signupTitle")}</h1>
      {state && !state.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{t(`errors.${state.code ?? "ERROR"}` as never)}</AlertDescription>
        </Alert>
      ) : null}
      <form onSubmit={form.handleSubmit(onValid)} className="flex flex-col gap-4" noValidate>
        {mode === "signup" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" autoComplete="name" {...form.register("name")} />
            <p className="text-xs text-destructive">{err(form.formState.errors.name?.message)}</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          <p className="text-xs text-destructive">{err(form.formState.errors.email?.message)}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            {...form.register("password")}
          />
          <p className="text-xs text-destructive">{err(form.formState.errors.password?.message)}</p>
        </div>
        <Button type="submit" size="lg" disabled={pending} data-testid="auth-submit">
          {mode === "login" ? t("submitLogin") : t("submitSignup")}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
        <Link
          href={{ pathname: mode === "login" ? "/signup" : "/login", query: next ? { next } : {} }}
          className="text-primary underline"
        >
          {mode === "login" ? t("submitSignup") : t("submitLogin")}
        </Link>
      </p>

      {demoAccounts?.length ? (
        <div className="rounded-lg border border-dashed p-3 text-sm">
          <p className="font-medium">{t("demoAccounts")}</p>
          <p className="mb-2 text-xs text-muted-foreground">{t("demoHint")}</p>
          <ul className="flex flex-col gap-1">
            {demoAccounts.map((a) => (
              <li key={a.email} className="flex items-center justify-between gap-2">
                <span className="truncate text-xs">
                  {a.label} · {a.email}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    form.setValue("email", a.email);
                    form.setValue("password", a.password);
                  }}
                >
                  {t("useDemo")}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
