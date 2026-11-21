import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/signup">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signupTitle") };
}

export default async function SignupPage({ params, searchParams }: PageProps<"/[locale]/signup">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Suspense fallback={<AuthForm mode="signup" />}>
      <SignupWithNext searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupWithNext({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <AuthForm mode="signup" next={typeof sp.next === "string" ? sp.next : undefined} />;
}
