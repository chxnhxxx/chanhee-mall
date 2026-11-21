/**
 * [쉬운 설명] 브라우저를 자동 조작해 실제 사용 흐름을 검사: 담기 → 로그인 → 주문 → 결제 → 취소, 관리자 발송, 권한 차단.
 * 리뷰 순서: 9단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { expect, type Page, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const CUSTOMER = "customer@chanhee-mall.test";
const ADMIN = "admin@chanhee-mall.test";

/** 로그인 화면의 "데모 계정으로 채우기" 버튼으로 로그인 (비밀번호를 테스트 코드에 적지 않음) */
async function loginAs(page: Page, email: string) {
  await page.getByRole("listitem").filter({ hasText: email }).getByRole("button").click();
  await page.getByTestId("auth-submit").click();
  // 로그인 성공 시 화면이 전체 새로고침으로 이동함 → 이동이 끝날 때까지 기다림
  await page.waitForURL((url) => !url.pathname.endsWith("/login"));
  await page.waitForLoadState("load");
}

async function addTumblerToCart(page: Page) {
  await page.goto("/ko/products/stainless-tumbler");
  await expect(page.getByTestId("product-name")).toHaveText("스테인리스 텀블러");
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
}

async function checkoutAndPay(page: Page) {
  await page.getByTestId("go-checkout").click();
  await expect(page).toHaveURL(/\/ko\/checkout$/);
  await page.locator("#recipient").fill("홍길동");
  await page.locator("#phone").fill("010-1234-5678");
  // 우편번호·주소는 원래 다음 우편번호 팝업으로 채움 → 테스트에서는 직접 입력
  for (const [id, value] of [
    ["postcode", "06236"],
    ["address1", "서울 강남구 테헤란로 1"],
  ] as const) {
    await page.locator(`#${id}`).evaluate((el) => el.removeAttribute("readonly"));
    await page.locator(`#${id}`).fill(value);
  }
  await page.locator("#address2").fill("101호");
  await page.getByTestId("place-order").click();

  await expect(page).toHaveURL(/\/ko\/checkout\/pay\//);
  await expect(page.getByTestId("pay-amount")).toContainText("22,800");
  await page.getByTestId("mock-pay").click();
  await expect(page.getByTestId("success-title")).toBeVisible();
}

test("손님: 둘러보기 → 담기 → 로그인 → 주문 → 모의 결제 → 주문 취소", async ({ page }) => {
  await page.goto("/ko");
  await expect(page.getByTestId("product-card").first()).toBeVisible();

  await addTumblerToCart(page);

  await page.goto("/ko/cart");
  await expect(page.getByTestId("cart-lines")).toContainText("스테인리스 텀블러");
  await expect(page.getByTestId("cart-total")).toContainText("22,800"); // 19,800 + 배송비 3,000
  await page.getByTestId("go-login").click();

  await loginAs(page, CUSTOMER);
  await expect(page).toHaveURL(/\/ko\/cart/);
  // 로그인 전에 담은 상품이 계정 장바구니로 합쳐짐
  await expect(page.getByTestId("cart-lines")).toContainText("스테인리스 텀블러");

  await checkoutAndPay(page);

  await page.getByRole("link", { name: "주문 상세 보기" }).click();
  await expect(page.getByTestId("order-status")).toHaveText("결제 완료");
  page.once("dialog", (d) => d.accept());
  await page.getByTestId("cancel-order").click();
  await expect(page.getByTestId("order-status")).toHaveText("취소됨");
});

test("관리자: 결제된 주문에 송장 입력 → 배송중", async ({ page, browser }) => {
  // 고객이 주문·결제
  const customer = await browser.newContext({ locale: "ko-KR" });
  const cpage = await customer.newPage();
  await cpage.goto("/ko/login");
  await loginAs(cpage, CUSTOMER);
  await addTumblerToCart(cpage);
  await cpage.goto("/ko/cart");
  await checkoutAndPay(cpage);
  await customer.close();

  // 일반 고객은 관리자 화면에 못 들어감 (홈으로 보냄) → 관리자로 로그인
  await page.goto("/ko/login?next=/ko/admin");
  await loginAs(page, ADMIN);
  await expect(page).toHaveURL(/\/ko\/admin$/);
  await expect(page.getByText("최근 주문")).toBeVisible();

  await page.goto("/ko/admin/orders?status=paid");
  await page.locator("tbody a").first().click();
  await page.getByTestId("tracking-input").fill("1234567890");
  await page.getByTestId("ship-order").click();
  await expect(page.getByText("배송중").first()).toBeVisible();
});

test("고객은 관리자 화면에 들어갈 수 없음", async ({ page }) => {
  await page.goto("/ko/login");
  await loginAs(page, CUSTOMER);
  await page.waitForURL(/\/ko(\/)?$/);
  await page.goto("/ko/admin");
  await expect(page).toHaveURL(/\/ko$/);
});

test("영어 화면과 검색", async ({ page }) => {
  await page.goto("/en/products?q=tumbler");
  await expect(page.getByTestId("product-card").first()).toContainText("Tumbler");
});
