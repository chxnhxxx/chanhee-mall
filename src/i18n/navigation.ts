/**
 * [쉬운 설명] 언어를 자동으로 붙여 주는 링크·이동 도구. 코드에서 '/cart' 라고만 써도 '/ko/cart' 로 이동합니다.
 * 리뷰 순서: 3단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// 언어 접두사(/ko, /en)를 자동으로 붙여주는 Link·redirect 등
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
