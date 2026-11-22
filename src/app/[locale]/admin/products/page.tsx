/**
 * [쉬운 설명] 관리자 상품 목록(숨김 상품 포함). 재고가 0이면 빨간색, 5개 미만이면 주황색.
 * 리뷰 순서: 7단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatKRW } from "@/lib/pricing";
import { repo } from "@/server/repo";
import { assertAdminPage } from "@/server/admin-page";

async function AdminProductsPageContent({ params }: PageProps<"/[locale]/admin/products">) {
  await assertAdminPage(params);
  const [products, categories] = await Promise.all([
    repo().listProducts({ includeUnpublished: true }),
    repo().listCategories(),
  ]);
  const catName = new Map(categories.map((c) => [c.id, c.nameKo]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">상품 ({products.length})</h1>
        <Button asChild>
          <Link href="/admin/products/new">새 상품</Link>
        </Button>
      </div>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>상품명</TableHead>
              <TableHead className="hidden md:table-cell">카테고리</TableHead>
              <TableHead className="text-right">가격</TableHead>
              <TableHead className="text-right">재고 합계</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const stock = p.variants.reduce((n, v) => n + v.stock, 0);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                      {p.nameKo}
                    </Link>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{catName.get(p.categoryId) ?? "-"}</TableCell>
                  <TableCell className="text-right">{formatKRW(p.price)}</TableCell>
                  <TableCell
                    className={`text-right ${stock === 0 ? "text-destructive" : stock < 5 ? "text-primary" : ""}`}
                  >
                    {stock}
                  </TableCell>
                  <TableCell>
                    {p.isPublished ? <Badge>판매중</Badge> : <Badge variant="secondary">숨김</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// 요청마다 달라지는 데이터(로그인·주문)는 Suspense 안에서 읽어야 함 (Cache Components 규칙)
export default function AdminProductsPage(props: PageProps<"/[locale]/admin/products">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AdminProductsPageContent {...props} />
    </Suspense>
  );
}
