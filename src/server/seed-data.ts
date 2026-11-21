/**
 * 데모 카탈로그 (PRD: 생활용품 4개 카테고리, 상품 24개, 옵션 포함).
 * 메모리 DB 초기값이자 supabase/seed.sql 생성 원본입니다 (pnpm db:seed-sql).
 * 이미지는 저작권 문제가 없도록 scripts/gen-placeholders.ts 가 만든 SVG를 씁니다.
 * 이 파일은 Node 타입 제거 실행(node file.ts)으로도 읽히므로 상대 경로 + .ts 확장자로 import 합니다.
 */
import type { Category, Product } from "../lib/domain.ts";

export const DEMO_ACCOUNTS = [
  // 데모 테스트 계정 (실제 개인정보 아님). 비밀번호는 데모 공개용입니다.
  { id: "00000000-0000-4000-8000-000000000001", email: "admin@chanhee-mall.test", password: "demo-admin-1234", name: "관리자", role: "admin" as const },
  { id: "00000000-0000-4000-8000-000000000002", email: "customer@chanhee-mall.test", password: "demo-user-1234", name: "데모고객", role: "customer" as const },
];

export const CATEGORIES: Category[] = [
  { id: "10000000-0000-4000-8000-000000000001", slug: "kitchen", nameKo: "주방", nameEn: "Kitchen", sortOrder: 1 },
  { id: "10000000-0000-4000-8000-000000000002", slug: "bathroom", nameKo: "욕실", nameEn: "Bathroom", sortOrder: 2 },
  { id: "10000000-0000-4000-8000-000000000003", slug: "storage", nameKo: "수납·정리", nameEn: "Storage", sortOrder: 3 },
  { id: "10000000-0000-4000-8000-000000000004", slug: "cleaning", nameKo: "청소", nameEn: "Cleaning", sortOrder: 4 },
];

type V = [nameKo: string, nameEn: string, priceDelta?: number, stock?: number];
type P = {
  slug: string;
  cat: number;
  ko: string;
  en: string;
  price: number;
  dko: string;
  den: string;
  variants: V[];
};

const RAW: P[] = [
  { slug: "stainless-tumbler", cat: 1, ko: "스테인리스 텀블러", en: "Stainless Tumbler", price: 19800, dko: "출퇴근길 커피를 6시간 따뜻하게. 이중 진공 구조라 겉면에 물방울이 맺히지 않습니다.", den: "Keeps your commute coffee warm for 6 hours with double-wall vacuum insulation.", variants: [["실버 / 350ml", "Silver / 350ml"], ["블랙 / 350ml", "Black / 350ml"], ["실버 / 500ml", "Silver / 500ml", 3000]] },
  { slug: "silicone-spatula-set", cat: 1, ko: "실리콘 주걱 세트", en: "Silicone Spatula Set", price: 12900, dko: "코팅 팬을 긁지 않는 실리콘 주걱 3종. 230℃까지 견딥니다.", den: "Three pan-safe silicone spatulas, heat resistant up to 230°C.", variants: [["그레이", "Gray"], ["베이지", "Beige"]] },
  { slug: "glass-container-set", cat: 1, ko: "내열유리 밀폐용기 3종", en: "Glass Container Set (3)", price: 24900, dko: "전자레인지·오븐 사용 가능한 내열유리 용기. 도시락 준비에 알맞습니다.", den: "Oven and microwave safe glass containers, perfect for meal prep.", variants: [["기본", "Default"]] },
  { slug: "bamboo-cutting-board", cat: 1, ko: "대나무 도마", en: "Bamboo Cutting Board", price: 15900, dko: "가볍고 칼자국이 덜 남는 대나무 도마.", den: "Lightweight bamboo board that resists knife marks.", variants: [["S", "S"], ["L", "L", 5000]] },
  { slug: "drip-kettle", cat: 1, ko: "드립 커피 주전자", en: "Pour-over Kettle", price: 32000, dko: "가는 주둥이로 물줄기를 조절하기 쉬운 600ml 드립 주전자.", den: "A 600ml gooseneck kettle for precise pour-over.", variants: [["600ml", "600ml"]] },
  { slug: "dish-rack", cat: 1, ko: "2단 식기건조대", en: "Two-tier Dish Rack", price: 38000, dko: "좁은 싱크대에도 들어가는 슬림 2단 건조대.", den: "Slim two-tier rack that fits narrow counters.", variants: [["화이트", "White"], ["블랙", "Black"]] },

  { slug: "cotton-towel", cat: 2, ko: "호텔식 면 타월 (2장)", en: "Hotel Cotton Towel (2 pcs)", price: 16900, dko: "40수 코마사로 짠 부드러운 타월 2장 세트.", den: "Soft 40-count combed cotton towels, set of two.", variants: [["화이트", "White"], ["그레이", "Gray"], ["네이비", "Navy"]] },
  { slug: "foam-dispenser", cat: 2, ko: "자동 거품 디스펜서", en: "Automatic Foam Dispenser", price: 27900, dko: "손을 대면 거품이 나오는 충전식 디스펜서.", den: "Touch-free rechargeable foam soap dispenser.", variants: [["화이트", "White"]] },
  { slug: "diatomite-bath-mat", cat: 2, ko: "규조토 발매트", en: "Diatomite Bath Mat", price: 21000, dko: "물기를 빠르게 흡수하고 금방 마르는 규조토 매트.", den: "Quick-drying diatomaceous earth bath mat.", variants: [["베이지", "Beige"], ["그레이", "Gray"]] },
  { slug: "toothbrush-holder", cat: 2, ko: "벽걸이 칫솔걸이", en: "Wall Toothbrush Holder", price: 9900, dko: "못 없이 붙이는 칫솔걸이. 물이 고이지 않는 구조.", den: "Adhesive wall holder that drains water.", variants: [["기본", "Default"]] },
  { slug: "shower-filter", cat: 2, ko: "샤워 필터 헤드", en: "Filtered Shower Head", price: 18500, dko: "녹물과 잔류 염소를 걸러주는 필터 샤워기.", den: "Shower head with a replaceable filter.", variants: [["기본", "Default"]] },
  { slug: "laundry-basket", cat: 2, ko: "접이식 빨래 바구니", en: "Foldable Laundry Basket", price: 14900, dko: "안 쓸 때는 납작하게 접어 두는 빨래 바구니.", den: "Folds flat when not in use.", variants: [["베이지", "Beige"], ["그레이", "Gray"]] },

  { slug: "stacking-box", cat: 3, ko: "스태킹 수납함", en: "Stacking Storage Box", price: 11900, dko: "쌓아도 안정적인 투명 수납함. 크기별로 섞어 쓰기 좋습니다.", den: "Clear stackable boxes in three sizes.", variants: [["S", "S"], ["M", "M", 3000], ["L", "L", 6000]] },
  { slug: "drawer-organizer", cat: 3, ko: "서랍 정리 트레이 6종", en: "Drawer Organizer (6 pcs)", price: 13500, dko: "서랍 크기에 맞춰 조합하는 정리 트레이.", den: "Mix-and-match trays for any drawer.", variants: [["기본", "Default"]] },
  { slug: "nonslip-hanger", cat: 3, ko: "논슬립 옷걸이 20개", en: "Non-slip Hangers (20)", price: 15000, dko: "옷이 미끄러지지 않는 얇은 벨벳 옷걸이.", den: "Slim velvet hangers that keep clothes in place.", variants: [["블랙", "Black"], ["화이트", "White"]] },
  { slug: "cable-organizer", cat: 3, ko: "케이블 정리함", en: "Cable Organizer Box", price: 17900, dko: "멀티탭과 전선을 숨기는 정리함.", den: "Hides power strips and tangled cables.", variants: [["기본", "Default"]] },
  { slug: "slim-shoe-rack", cat: 3, ko: "슬림 신발장 정리대", en: "Slim Shoe Rack", price: 29900, dko: "신발장 공간을 두 배로 쓰는 2단 정리대.", den: "Doubles your shoe cabinet space.", variants: [["기본", "Default", 0, 3]] },
  { slug: "vacuum-bags", cat: 3, ko: "압축팩 5매", en: "Vacuum Storage Bags (5)", price: 12000, dko: "계절 이불과 옷 부피를 줄여주는 압축팩.", den: "Shrinks bulky bedding and clothes.", variants: [["기본", "Default"]] },

  { slug: "microfiber-cloth", cat: 4, ko: "극세사 행주 10매", en: "Microfiber Cloths (10)", price: 8900, dko: "흡수력 좋고 빨리 마르는 극세사 행주.", den: "Absorbent, quick-drying microfiber cloths.", variants: [["기본", "Default"]] },
  { slug: "cordless-mop", cat: 4, ko: "무선 물걸레 청소기", en: "Cordless Spin Mop", price: 89000, dko: "회전 패드로 바닥을 닦는 무선 청소기. (품절 표시 예시 상품)", den: "Cordless spinning mop. (Sold-out example item)", variants: [["기본", "Default", 0, 0]] },
  { slug: "lint-roller", cat: 4, ko: "리필형 돌돌이", en: "Refillable Lint Roller", price: 7500, dko: "먼지와 머리카락을 떼어내는 리필형 클리너.", den: "Picks up lint and hair, refillable.", variants: [["기본", "Default"]] },
  { slug: "eco-cleaner", cat: 4, ko: "친환경 다목적 세정제", en: "Eco All-purpose Cleaner", price: 9800, dko: "식물 유래 성분의 다목적 세정제.", den: "Plant-based all-purpose cleaner.", variants: [["500ml", "500ml"], ["1L", "1L", 5000]] },
  { slug: "static-duster", cat: 4, ko: "정전기 먼지떨이", en: "Static Duster", price: 6900, dko: "틈새 먼지까지 붙잡는 정전기 먼지떨이.", den: "Grabs dust from tight spots.", variants: [["기본", "Default"]] },
  { slug: "pedal-trash-can", cat: 4, ko: "페달 휴지통 12L", en: "Pedal Trash Can 12L", price: 24000, dko: "뚜껑이 조용히 닫히는 페달식 휴지통.", den: "Soft-close pedal bin.", variants: [["화이트", "White"], ["그레이", "Gray"]] },
];

const pad = (n: number, len = 12) => String(n).padStart(len, "0");

export const PRODUCTS: Product[] = RAW.map((p, i) => {
  const productId = `20000000-0000-4000-8000-${pad(i + 1)}`;
  return {
    id: productId,
    slug: p.slug,
    categoryId: CATEGORIES[p.cat - 1].id,
    nameKo: p.ko,
    nameEn: p.en,
    descriptionKo: p.dko,
    descriptionEn: p.den,
    price: p.price,
    images: [`/products/${p.slug}.svg`],
    isPublished: true,
    createdAt: new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString(),
    variants: p.variants.map(([nameKo, nameEn, priceDelta = 0, stock = 50], j) => ({
      id: `30000000-0000-4000-8000-${pad((i + 1) * 100 + j + 1)}`,
      productId,
      sku: `${p.slug.toUpperCase().slice(0, 12)}-${j + 1}`,
      nameKo,
      nameEn,
      priceDelta,
      stock,
    })),
  };
});
