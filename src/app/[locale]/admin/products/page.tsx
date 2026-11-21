import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { formatKRW } from "@/lib/pricing";
import { repo } from "@/server/repo";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    repo().listProducts({ includeUnpublished: true }),
    repo().listCategories(),
  ]);
  const catName = new Map(categories.map((c) => [c.id, c.nameKo]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">상품 ({products.length})</h1>
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
                  <TableCell className={`text-right ${stock === 0 ? "text-destructive" : stock < 5 ? "text-amber-600" : ""}`}>
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
