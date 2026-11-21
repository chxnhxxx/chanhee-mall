import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

// 관리자 화면은 한국어 전용입니다 (운영자 1명 기준).
// 권한 검사는 각 페이지의 assertAdminPage() 와 각 서버 액션의 requireAdmin() 이 합니다.
export const metadata: Metadata = { title: "관리자", robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  // Link 가 현재 언어를 헤더에서 읽지 않도록 미리 알려줌 (정적 미리 렌더 유지)
  setRequestLocale((await params).locale);
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
      {children}
    </div>
  );
}
