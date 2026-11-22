/**
 * [쉬운 설명] 상품 사진 대신 쓰는 선화 일러스트(SVG) 24장을 public/products 에 만드는 도구. `pnpm gen:placeholders`.
 * 사진 대신 직접 그린 그림이라 저작권 걱정이 없습니다. 모든 그림은 같은 규칙(가는 회색 선, 옅은 종이색 면)으로 그립니다.
 * 리뷰 순서: 4단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { CATEGORIES, PRODUCTS } from "../src/server/seed-data.ts";

// ▶ 카테고리별 바탕색 — 사이트 팔레트(미색·짙은 회색)에 맞춰, 색 차이는 아주 옅게만
const BG: Record<string, string> = {
  kitchen: "#EAE6DE",
  bathroom: "#E6E7E4",
  storage: "#E9E5DD",
  cleaning: "#E5E6E0",
};

// ▶ 공통 재료: 선 색, 면 색 3가지
const LINE = "#5c574f";
const PAPER = "#f6f4ef"; // 흰 플라스틱·유리·천
const KRAFT = "#e9e2d4"; // 베이지 천·종이
const WOOD = "#e3d6bd"; // 나무·대나무

/** 바닥 그림자 (모든 그림 공통) */
const shadow = (rx = 190, cy = 640) =>
  `<ellipse cx="400" cy="${cy}" rx="${rx}" ry="16" fill="${LINE}" opacity="0.07" stroke="none"/>`;

/** 상품별 그림. 800×800 판의 가운데(대략 x 160~640, y 150~640)에 그립니다. */
const DRAW: Record<string, string> = {
  "stainless-tumbler": `${shadow(110, 622)}
    <path d="M332 262 L468 262 L454 598 Q453 614 437 614 L363 614 Q347 614 346 598 Z" fill="${PAPER}"/>
    <line x1="336" y1="350" x2="464" y2="350" opacity=".45"/>
    <rect x="322" y="222" width="156" height="44" rx="10" fill="${KRAFT}"/>
    <line x1="372" y1="244" x2="428" y2="244"/>`,

  "silicone-spatula-set": `${shadow(170, 630)}
    <g transform="rotate(-20 400 620)"><rect x="392" y="330" width="16" height="290" rx="8" fill="${WOOD}"/><path d="M362 330 L438 330 L438 210 Q438 170 400 170 Q362 170 362 210 Z" fill="${KRAFT}"/></g>
    <g><rect x="392" y="330" width="16" height="290" rx="8" fill="${WOOD}"/><ellipse cx="400" cy="250" rx="46" ry="74" fill="${PAPER}"/></g>
    <g transform="rotate(20 400 620)"><rect x="392" y="330" width="16" height="290" rx="8" fill="${WOOD}"/><path d="M360 330 L440 330 L440 190 L360 190 Z" fill="${KRAFT}"/><line x1="380" y1="210" x2="380" y2="310" opacity=".45"/><line x1="400" y1="210" x2="400" y2="310" opacity=".45"/><line x1="420" y1="210" x2="420" y2="310" opacity=".45"/></g>`,

  "glass-container-set": `${shadow(180, 628)}
    <rect x="250" y="470" width="300" height="150" rx="18" fill="${PAPER}" fill-opacity=".7"/>
    <rect x="240" y="448" width="320" height="28" rx="10" fill="${KRAFT}"/>
    <rect x="275" y="332" width="250" height="110" rx="16" fill="${PAPER}" fill-opacity=".7"/>
    <rect x="265" y="312" width="270" height="26" rx="9" fill="${KRAFT}"/>
    <rect x="300" y="218" width="200" height="88" rx="14" fill="${PAPER}" fill-opacity=".7"/>
    <rect x="290" y="198" width="220" height="24" rx="8" fill="${KRAFT}"/>
    <line x1="270" y1="500" x2="270" y2="590" opacity=".35"/><line x1="295" y1="355" x2="295" y2="420" opacity=".35"/><line x1="318" y1="238" x2="318" y2="288" opacity=".35"/>`,

  "bamboo-cutting-board": `${shadow(200, 600)}
    <rect x="220" y="300" width="360" height="270" rx="26" fill="${WOOD}"/>
    <circle cx="535" cy="342" r="15" fill="${BG.kitchen}"/>
    <g opacity=".4" stroke-width="2.5"><line x1="280" y1="312" x2="280" y2="558"/><line x1="340" y1="312" x2="340" y2="558"/><line x1="400" y1="312" x2="400" y2="558"/><line x1="460" y1="312" x2="460" y2="558"/></g>`,

  "drip-kettle": `${shadow(160, 618)}
    <path d="M300 600 L500 600 Q520 600 516 580 L490 384 Q485 352 455 352 L345 352 Q315 352 310 384 L284 580 Q280 600 300 600 Z" fill="${PAPER}"/>
    <path d="M345 352 Q400 302 455 352" fill="${KRAFT}"/>
    <circle cx="400" cy="314" r="11" fill="${KRAFT}"/>
    <path d="M296 560 C236 540 236 430 176 328" stroke-width="10"/>
    <path d="M500 398 C584 398 594 542 508 562" stroke-width="12" fill="none"/>`,

  "dish-rack": `${shadow(200, 624)}
    <circle cx="320" cy="250" r="62" fill="${PAPER}"/><circle cx="388" cy="246" r="66" fill="${PAPER}"/><circle cx="456" cy="250" r="62" fill="${PAPER}"/>
    <rect x="230" y="296" width="340" height="22" rx="6" fill="${KRAFT}"/>
    <rect x="300" y="420" width="64" height="62" rx="8" fill="${PAPER}"/><rect x="384" y="420" width="64" height="62" rx="8" fill="${PAPER}"/>
    <rect x="230" y="480" width="340" height="22" rx="6" fill="${KRAFT}"/>
    <line x1="252" y1="296" x2="252" y2="600"/><line x1="548" y1="296" x2="548" y2="600"/>
    <rect x="220" y="592" width="360" height="22" rx="8" fill="${PAPER}"/>`,

  "cotton-towel": `${shadow(190, 616)}
    <rect x="250" y="470" width="300" height="130" rx="16" fill="${PAPER}"/>
    <path d="M250 520 Q400 500 550 520" opacity=".4"/>
    <rect x="272" y="356" width="256" height="118" rx="16" fill="${KRAFT}"/>
    <path d="M272 404 Q400 386 528 404" opacity=".4"/>
    <line x1="292" y1="480" x2="292" y2="592" opacity=".35"/><line x1="508" y1="480" x2="508" y2="592" opacity=".35"/>
    <line x1="312" y1="364" x2="312" y2="466" opacity=".35"/><line x1="488" y1="364" x2="488" y2="466" opacity=".35"/>`,

  "foam-dispenser": `${shadow(110, 618)}
    <rect x="318" y="330" width="164" height="276" rx="42" fill="${PAPER}"/>
    <rect x="344" y="290" width="112" height="52" rx="18" fill="${KRAFT}"/>
    <path d="M456 300 L522 300 Q530 300 530 308 L530 318 L456 318" fill="${KRAFT}"/>
    <circle cx="400" cy="390" r="12" fill="${KRAFT}"/>
    <g opacity=".5"><circle cx="556" cy="352" r="12" fill="${PAPER}"/><circle cx="582" cy="384" r="8" fill="${PAPER}"/><circle cx="546" cy="394" r="6" fill="${PAPER}"/></g>`,

  "diatomite-bath-mat": `${shadow(250, 624)}
    <polygon points="160,592 640,592 640,610 160,610" fill="${KRAFT}"/>
    <polygon points="232,468 568,468 640,592 160,592" fill="${PAPER}"/>
    <g fill="${LINE}" stroke="none" opacity=".22"><circle cx="300" cy="520" r="3"/><circle cx="380" cy="500" r="3"/><circle cx="470" cy="540" r="3"/><circle cx="540" cy="505" r="3"/><circle cx="250" cy="565" r="3"/><circle cx="420" cy="570" r="3"/><circle cx="590" cy="570" r="3"/></g>`,

  "toothbrush-holder": `
    ${[320, 400, 480]
      .map(
        (x, i) =>
          `<rect x="${x - 8}" y="${200 - i * 12}" width="16" height="250" rx="8" fill="${i === 1 ? KRAFT : PAPER}"/><rect x="${x - 13}" y="${160 - i * 12}" width="26" height="50" rx="5" fill="${PAPER}"/><line x1="${x - 4}" y1="${166 - i * 12}" x2="${x - 4}" y2="${204 - i * 12}" opacity=".4"/><line x1="${x + 4}" y1="${166 - i * 12}" x2="${x + 4}" y2="${204 - i * 12}" opacity=".4"/>`,
      )
      .join("")}
    <rect x="258" y="330" width="284" height="64" rx="32" fill="${PAPER}"/>
    <circle cx="282" cy="362" r="6" fill="${KRAFT}"/><circle cx="518" cy="362" r="6" fill="${KRAFT}"/>`,

  "shower-filter": `${shadow(150, 640)}
    <g transform="rotate(-28 400 420)">
      <rect x="374" y="388" width="52" height="250" rx="24" fill="${PAPER}"/>
      <rect x="388" y="440" width="24" height="96" rx="10" fill="${KRAFT}"/>
      <circle cx="400" cy="300" r="106" fill="${PAPER}"/>
      <circle cx="400" cy="300" r="78" fill="${KRAFT}"/>
      <g fill="${LINE}" stroke="none" opacity=".45">${[-40, -20, 0, 20, 40]
        .flatMap((dx) =>
          [-40, -20, 0, 20, 40]
            .filter((dy) => dx * dx + dy * dy <= 1700)
            .map((dy) => `<circle cx="${400 + dx}" cy="${300 + dy}" r="3.5"/>`),
        )
        .join("")}</g>
    </g>`,

  "laundry-basket": `${shadow(170, 616)}
    <path d="M240 330 L560 330 L532 600 L268 600 Z" fill="${PAPER}"/>
    <line x1="247" y1="400" x2="553" y2="400" opacity=".45"/><line x1="254" y1="470" x2="546" y2="470" opacity=".45"/><line x1="261" y1="540" x2="539" y2="540" opacity=".45"/>
    <rect x="232" y="318" width="336" height="22" rx="8" fill="${KRAFT}"/>
    <rect x="300" y="352" width="64" height="22" rx="11" fill="${BG.storage}"/><rect x="436" y="352" width="64" height="22" rx="11" fill="${BG.storage}"/>`,

  "stacking-box": `${shadow(190, 618)}
    <rect x="240" y="452" width="320" height="150" rx="10" fill="${PAPER}"/>
    <rect x="232" y="438" width="336" height="22" rx="6" fill="${KRAFT}"/>
    <rect x="370" y="500" width="60" height="18" rx="9" fill="${BG.storage}"/>
    <rect x="262" y="302" width="276" height="132" rx="10" fill="${PAPER}"/>
    <rect x="254" y="288" width="292" height="20" rx="6" fill="${KRAFT}"/>
    <rect x="370" y="344" width="60" height="18" rx="9" fill="${BG.storage}"/>`,

  "drawer-organizer": `
    <rect x="218" y="238" width="364" height="324" rx="10" fill="${KRAFT}" opacity=".7"/>
    <rect x="234" y="254" width="152" height="140" rx="10" fill="${PAPER}"/>
    <rect x="396" y="254" width="170" height="70" rx="10" fill="${PAPER}"/>
    <rect x="396" y="334" width="170" height="60" rx="10" fill="${PAPER}"/>
    <rect x="234" y="404" width="100" height="142" rx="10" fill="${PAPER}"/>
    <rect x="344" y="404" width="100" height="142" rx="10" fill="${PAPER}"/>
    <rect x="454" y="404" width="112" height="142" rx="10" fill="${PAPER}"/>`,

  "nonslip-hanger": [0, 60, 120]
    .map(
      (dy, i) =>
        `<g transform="translate(0 ${dy})" opacity="${1 - i * 0.25}"><path d="M400 256 L400 236 Q400 214 420 206 Q446 196 446 176 Q446 152 422 152 Q400 152 398 172"/><path d="M400 256 L232 392 Q222 402 238 402 L562 402 Q578 402 568 392 Z" fill="${i === 0 ? PAPER : "none"}" stroke-width="7"/></g>`,
    )
    .join(""),

  "cable-organizer": `${shadow(190, 628)}
    <path d="M232 470 C172 470 168 600 262 618" stroke-width="7"/>
    <rect x="248" y="606" width="34" height="22" rx="4" fill="${KRAFT}"/>
    <path d="M568 470 C640 470 650 592 560 612" stroke-width="7"/>
    <rect x="530" y="600" width="34" height="22" rx="4" fill="${KRAFT}"/>
    <rect x="230" y="330" width="340" height="232" rx="42" fill="${PAPER}"/>
    <line x1="236" y1="384" x2="564" y2="384" opacity=".45"/>
    <rect x="224" y="450" width="18" height="44" rx="9" fill="${KRAFT}"/><rect x="558" y="450" width="18" height="44" rx="9" fill="${KRAFT}"/>`,

  "slim-shoe-rack": `${shadow(120, 640)}
    <line x1="330" y1="168" x2="330" y2="632"/><line x1="470" y1="168" x2="470" y2="632"/>
    ${[288, 404, 520, 632]
      .map(
        (y, i) =>
          `<line x1="330" y1="${y}" x2="470" y2="${y}"/>${
            i < 3
              ? `<path d="M344 ${y - 4} L344 ${y - 30} Q344 ${y - 46} 360 ${y - 44} L398 ${y - 36} Q420 ${y - 32} 440 ${y - 20} L454 ${y - 12} Q460 ${y - 8} 460 ${y - 4} Z" fill="${i === 1 ? KRAFT : PAPER}"/>`
              : ""
          }`,
      )
      .join("")}`,

  "vacuum-bags": `${shadow(200, 620)}
    <g transform="rotate(-6 400 460)"><rect x="236" y="320" width="340" height="250" rx="24" fill="${KRAFT}"/></g>
    <rect x="222" y="340" width="360" height="262" rx="24" fill="${PAPER}"/>
    <line x1="230" y1="376" x2="574" y2="376"/>
    <rect x="252" y="366" width="34" height="20" rx="5" fill="${KRAFT}"/>
    <path d="M262 440 Q320 420 360 450 T460 440" opacity=".35"/><path d="M262 520 Q330 500 370 530 T420 520" opacity=".35"/>
    <circle cx="482" cy="500" r="36" fill="${KRAFT}"/><circle cx="482" cy="500" r="18" fill="${PAPER}"/>`,

  "microfiber-cloth": `${shadow(190, 612)}
    <g transform="rotate(-9 400 460)"><rect x="250" y="320" width="300" height="270" rx="12" fill="${KRAFT}"/></g>
    <g transform="rotate(5 400 460)"><rect x="252" y="324" width="296" height="266" rx="12" fill="#ddd9d0"/></g>
    <rect x="254" y="330" width="292" height="262" rx="12" fill="${PAPER}"/>
    <path d="M546 342 L546 430 L458 342 Z" fill="${KRAFT}"/>
    <g opacity=".3" stroke-width="2.5"><line x1="290" y1="400" x2="500" y2="400"/><line x1="290" y1="440" x2="510" y2="440"/><line x1="290" y1="480" x2="510" y2="480"/><line x1="290" y1="520" x2="510" y2="520"/></g>`,

  "cordless-mop": `${shadow(200, 632)}
    <line x1="400" y1="150" x2="400" y2="530" stroke-width="12"/>
    <rect x="386" y="148" width="28" height="86" rx="12" fill="${KRAFT}"/>
    <rect x="376" y="300" width="48" height="94" rx="16" fill="${PAPER}"/>
    <path d="M400 530 L344 590 M400 530 L456 590"/>
    <ellipse cx="338" cy="604" rx="84" ry="22" fill="${PAPER}"/><ellipse cx="462" cy="604" rx="84" ry="22" fill="${KRAFT}"/>`,

  "lint-roller": `${shadow(150, 630)}
    <g transform="rotate(-32 400 420)">
      <rect x="290" y="210" width="220" height="114" rx="22" fill="${PAPER}"/>
      <g opacity=".35" stroke-width="2.5"><line x1="340" y1="216" x2="340" y2="318"/><line x1="390" y1="216" x2="390" y2="318"/><line x1="440" y1="216" x2="440" y2="318"/></g>
      <path d="M290 267 L268 267 L268 350 L400 350 M510 267 L532 267 L532 350 L400 350 L400 372"/>
      <rect x="378" y="368" width="44" height="236" rx="20" fill="${KRAFT}"/>
    </g>`,

  "eco-cleaner": `${shadow(120, 622)}
    <path d="M332 362 L468 362 L480 600 Q480 616 464 616 L336 616 Q320 616 320 600 Z" fill="${PAPER}"/>
    <rect x="364" y="318" width="72" height="46" rx="6" fill="${KRAFT}"/>
    <path d="M352 320 L352 252 Q352 230 374 230 L470 230 L504 262 L470 274 L456 274 L456 320 Z" fill="${PAPER}"/>
    <path d="M424 274 Q430 314 404 324"/>
    <rect x="346" y="430" width="108" height="112" rx="8" fill="${KRAFT}"/>
    <path d="M400 520 C370 496 374 462 410 452 C424 478 420 506 400 520 Z" fill="${PAPER}"/><path d="M400 520 L410 470" opacity=".6"/>`,

  "static-duster": `${shadow(140, 630)}
    <g transform="rotate(14 400 420)">
      <rect x="386" y="380" width="28" height="250" rx="13" fill="${WOOD}"/>
      <path d="M326 384 C286 364 296 300 330 292 C318 250 362 218 392 240 C402 200 452 204 462 240 C504 234 524 282 496 306 C532 330 512 384 472 384 Z" fill="${PAPER}"/>
      <g opacity=".35" stroke-width="2.5"><path d="M350 360 L362 330"/><path d="M390 364 L396 320"/><path d="M432 362 L430 316"/><path d="M468 356 L460 320"/><path d="M372 290 L380 268"/><path d="M430 280 L428 256"/></g>
    </g>`,

  "pedal-trash-can": `${shadow(150, 626)}
    <path d="M302 304 L498 304 L488 598 L312 598 Z" fill="${PAPER}"/>
    <rect x="290" y="282" width="220" height="26" rx="10" fill="${KRAFT}"/>
    <line x1="370" y1="282" x2="430" y2="282" stroke-width="8"/>
    <line x1="308" y1="566" x2="492" y2="566" opacity=".4"/>
    <rect x="360" y="596" width="80" height="20" rx="6" fill="${KRAFT}"/>`,
};

const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

mkdirSync(new URL("../public/products/", import.meta.url), { recursive: true });

for (const p of PRODUCTS) {
  const cat = CATEGORIES.find((c) => c.id === p.categoryId)!;
  const art = DRAW[p.slug];
  if (!art) throw new Error(`그림이 없는 상품: ${p.slug}`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${esc(p.nameEn)}">
  <rect width="800" height="800" fill="${BG[cat.slug]}"/>
  <g fill="none" stroke="${LINE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${art}
  </g>
</svg>
`;
  writeFileSync(new URL(`../public/products/${p.slug}.svg`, import.meta.url), svg);
}
console.log(`public/products/*.svg ${PRODUCTS.length}개 생성`);
