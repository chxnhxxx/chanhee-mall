/**
 * [쉬운 설명] 디자인 부품: 로딩 중 회색 상자. shadcn/ui 도구가 자동으로 만든 파일이라 직접 고칠 일은 거의 없습니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

export { Skeleton };
