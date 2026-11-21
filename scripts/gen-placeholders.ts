/**
 * [쉬운 설명] 상품 사진 대신 쓸 임시 그림(SVG) 24장을 public/products 에 만드는 도구. `pnpm gen:placeholders`.
 * 리뷰 순서: 4단계 (docs/REVIEW_GUIDE.md 참고)
 */
/**
 * 상품 이미지 자리표시 SVG 생성 (저작권 걱정 없는 직접 만든 이미지).
 * 실행: pnpm gen:placeholders
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { CATEGORIES, PRODUCTS } from "../src/server/seed-data.ts";

// 카테고리별 [바탕색, 글자색] — 사이트 팔레트(코발트·버터·민트)에 맞춤
const palette: Record<string, [string, string]> = {
  kitchen: ["#FFF1BF", "#8A6200"],
  bathroom: ["#DCE6FF", "#2B4ACB"],
  storage: ["#E6E1FA", "#4B3AA8"],
  cleaning: ["#D3EEE1", "#1F6B4A"],
};

const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

mkdirSync(new URL("../public/products/", import.meta.url), { recursive: true });

for (const p of PRODUCTS) {
  const cat = CATEGORIES.find((c) => c.id === p.categoryId)!;
  const [bg, fg] = palette[cat.slug];
  const initials = p.nameEn
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${esc(p.nameEn)}">
  <rect width="800" height="800" fill="${bg}"/>
  <circle cx="400" cy="340" r="190" fill="${fg}" opacity="0.14"/>
  <rect x="270" y="210" width="260" height="260" rx="72" fill="${fg}"/>
  <text x="400" y="372" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="110" font-weight="700" fill="#ffffff">${esc(initials)}</text>
  <text x="400" y="600" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="${fg}">${esc(p.nameEn)}</text>
  <text x="400" y="650" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="${fg}" opacity="0.7">${esc(cat.nameEn)}</text>
</svg>
`;
  writeFileSync(new URL(`../public/products/${p.slug}.svg`, import.meta.url), svg);
}
console.log(`public/products/*.svg ${PRODUCTS.length}개 생성`);
