import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// 언어 접두사(/ko, /en)를 자동으로 붙여주는 Link·redirect 등
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
