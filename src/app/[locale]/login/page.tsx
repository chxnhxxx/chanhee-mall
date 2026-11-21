import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Skeleton } from "@/components/ui/skeleton";
import { DEMO_ACCOUNTS } from "@/server/seed-data";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("loginTitle") };
}

// 데모 사이트이므로 테스트 계정을 화면에 안내 (실제 서비스라면 절대 하지 않음)
const demoAccounts = DEMO_ACCOUNTS.map((a) => ({
  email: a.email,
  password: a.password,
  label: a.role === "admin" ? "admin" : "customer",
}));

export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-8 h-96 w-full max-w-sm" />}>
      <LoginWithNext searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginWithNext({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return <AuthForm mode="login" next={next} demoAccounts={demoAccounts} />;
}
