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

// 카테고리별 [바탕색, 글자색] — 사이트 팔레트(미색·짙은 회색)에 맞춰, 색 차이는 아주 옅게만
const palette: Record<string, [string, string]> = {
  kitchen: ["#EAE6DE", "#6F6A62"],
  bathroom: ["#E6E7E4", "#66696A"],
  storage: ["#E9E5DD", "#6E685F"],
  cleaning: ["#E5E6E0", "#676A62"],
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
  <text x="400" y="420" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="150" font-weight="300" letter-spacing="6" fill="${fg}" opacity="0.55">${esc(initials)}</text>
  <line x1="340" y1="520" x2="460" y2="520" stroke="${fg}" stroke-width="2" opacity="0.4"/>
  <text x="400" y="590" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="${fg}">${esc(p.nameEn)}</text>
  <text x="400" y="636" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="3" fill="${fg}" opacity="0.7">${esc(cat.nameEn)}</text>
</svg>
`;
  writeFileSync(new URL(`../public/products/${p.slug}.svg`, import.meta.url), svg);
}
console.log(`public/products/*.svg ${PRODUCTS.length}개 생성`);
