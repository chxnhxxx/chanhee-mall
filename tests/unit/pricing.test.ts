/**
 * [쉬운 설명] 돈 계산 규칙 검사: 배송비 기준, 합계, 주문명, 주문번호 형식.
 * 리뷰 순서: 9단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { describe, expect, it } from "vitest";
import {
  buildOrderName,
  generateOrderNumber,
  isValidTossOrderId,
  shippingFeeFor,
  summarize,
  unitPrice,
} from "@/lib/pricing";

describe("가격 규칙", () => {
  it("3만원 이상이면 배송비 무료, 미만이면 3000원, 0원이면 0원", () => {
    expect(shippingFeeFor(0)).toBe(0);
    expect(shippingFeeFor(29_999)).toBe(3000);
    expect(shippingFeeFor(30_000)).toBe(0);
  });

  it("합계 = 상품금액 + 배송비", () => {
    expect(summarize([{ unitPrice: 12_000, quantity: 2 }])).toEqual({
      itemsAmount: 24_000,
      shippingFee: 3000,
      totalAmount: 27_000,
    });
    expect(summarize([{ unitPrice: 15_000, quantity: 2 }]).totalAmount).toBe(30_000);
  });

  it("옵션 추가금 반영, 음수 가격은 거부", () => {
    expect(unitPrice(10_000, 2000)).toBe(12_000);
    expect(unitPrice(10_000, -1000)).toBe(9000);
    expect(() => unitPrice(1000, -2000)).toThrow();
  });

  it("주문명은 '첫 상품 외 N건'", () => {
    expect(buildOrderName(["텀블러"])).toBe("텀블러");
    expect(buildOrderName(["텀블러", "수세미", "행주"])).toBe("텀블러 외 2건");
  });

  it("주문번호는 토스 orderId 규칙(6~64자, 영문·숫자·-·_)을 지킴", () => {
    const n = generateOrderNumber(new Date("2026-11-22T00:00:00Z"));
    expect(n).toMatch(/^CH20261122-[A-Z2-9]{10}$/);
    expect(isValidTossOrderId(n)).toBe(true);
    expect(isValidTossOrderId("abc")).toBe(false);
    expect(isValidTossOrderId("주문123456")).toBe(false);
  });
});
