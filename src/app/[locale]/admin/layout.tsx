import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth";

// 관리자 화면은 한국어 전용입니다 (운영자 1명 기준)
export const metadata: Metadata = { title: "관리자", robots: { index: false, follow: false } };

export default function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-1 border-b pb-3 text-sm">
        <span className="mr-3 font-bold">관리자</span>
        <Link href="/admin" className="rounded-md px-3 py-1.5 hover:bg-muted">
          대시보드
        </Link>
        <Link href="/admin/products" className="rounded-md px-3 py-1.5 hover:bg-muted">
          상품
        </Link>
        <Link href="/admin/orders" className="rounded-md px-3 py-1.5 hover:bg-muted">
          주문
        </Link>
      </nav>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AdminGuard params={params}>{children}</AdminGuard>
      </Suspense>
    </div>
  );
}

/** 화면 보호: 로그인 안 했으면 로그인으로, 관리자가 아니면 홈으로. (서버 액션도 각자 requireAdmin 으로 다시 검사) */
async function AdminGuard({ params, children }: { params: Promise<{ locale: string }>; children: React.ReactNode }) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect({ href: { pathname: "/login", query: { next: `/${locale}/admin` } }, locale });
  if (session!.role !== "admin") redirect({ href: "/", locale });
  return <>{children}</>;
}
