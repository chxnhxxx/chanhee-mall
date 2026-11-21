/**
 * [쉬운 설명] 디자인 부품: 입력칸 이름표. shadcn/ui 도구가 자동으로 만든 파일이라 직접 고칠 일은 거의 없습니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label as LabelPrimitive } from "radix-ui";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
