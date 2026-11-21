import { beforeEach, describe, expect, it } from "vitest";
import type { ShippingAddress } from "@/lib/domain";
import { createMemoryRepo, resetMemoryDb } from "@/server/repo/memory";
import { RepoError } from "@/server/repo/types";

const shipping: ShippingAddress = {
  recipient: "홍길동",
  phone: "010-1234-5678",
  postcode: "06236",
  address1: "서울 강남구 테헤란로 1",
  address2: "101호",
};
const USER = "00000000-0000-4000-8000-0000000000aa";

async function variantOf(slug: string, index = 0) {
  const p = await createMemoryRepo().getProductBySlug(slug);
  if (!p) throw new Error(`no product ${slug}`);
  return p.variants[index];
}

describe("메모리 저장소: 주문과 재고", () => {
  beforeEach(() => resetMemoryDb());

  it("주문하면 재고가 줄고, 금액은 DB 가격 기준으로 계산됨", async () => {
    const repo = createMemoryRepo();
    const v = await variantOf("slim-shoe-rack"); // 29,900원, 재고 3
    const order = await repo.createOrder({
      userId: USER,
      orderNumber: "CH20261122-TEST000001",
      shipping,
      lines: [{ variantId: v.id, quantity: 2 }],
    });
    expect(order.status).toBe("pending_payment");
    expect(order.itemsAmount).toBe(59_800);
    expect(order.shippingFee).toBe(0);
    expect(order.totalAmount).toBe(59_800);
    expect((await variantOf("slim-shoe-rack")).stock).toBe(1);
  });

  it("재고보다 많이 주문하면 OUT_OF_STOCK, 재고는 그대로", async () => {
    const repo = createMemoryRepo();
    const v = await variantOf("slim-shoe-rack");
    await expect(
      repo.createOrder({
        userId: USER,
        orderNumber: "CH20261122-TEST000002",
        shipping,
        lines: [{ variantId: v.id, quantity: 4 }],
      }),
    ).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
    expect((await variantOf("slim-shoe-rack")).stock).toBe(3);
  });

  it("한 줄이라도 실패하면 다른 줄의 재고도 줄지 않음 (전부 아니면 전무)", async () => {
    const repo = createMemoryRepo();
    const ok = await variantOf("stainless-tumbler");
    const soldOut = await variantOf("cordless-mop");
    await expect(
      repo.createOrder({
        userId: USER,
        orderNumber: "CH20261122-TEST000003",
        shipping,
        lines: [
          { variantId: ok.id, quantity: 1 },
          { variantId: soldOut.id, quantity: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(RepoError);
    expect((await variantOf("stainless-tumbler")).stock).toBe(ok.stock);
  });

  it("결제 완료는 한 번만 반영됨 (중복 승인 방지)", async () => {
    const repo = createMemoryRepo();
    const v = await variantOf("stainless-tumbler");
    await repo.createOrder({
      userId: USER,
      orderNumber: "CH20261122-TEST000004",
      shipping,
      lines: [{ variantId: v.id, quantity: 1 }],
    });
    const first = await repo.markPaid({
      orderNumber: "CH20261122-TEST000004",
      paymentKey: "mock_1",
      method: "카드",
      paidAt: new Date().toISOString(),
    });
    const second = await repo.markPaid({
      orderNumber: "CH20261122-TEST000004",
      paymentKey: "mock_2",
      method: "카드",
      paidAt: new Date().toISOString(),
    });
    expect(first?.status).toBe("paid");
    expect(second).toBeNull();
  });

  it("취소하면 재고가 돌아오고, 이미 취소된 주문은 다시 취소 못 함", async () => {
    const repo = createMemoryRepo();
    const v = await variantOf("slim-shoe-rack");
    const order = await repo.createOrder({
      userId: USER,
      orderNumber: "CH20261122-TEST000005",
      shipping,
      lines: [{ variantId: v.id, quantity: 3 }],
    });
    expect((await variantOf("slim-shoe-rack")).stock).toBe(0);
    await repo.closeOrderRestock(order.id, ["pending_payment", "paid"], "cancelled");
    expect((await variantOf("slim-shoe-rack")).stock).toBe(3);
    await expect(repo.closeOrderRestock(order.id, ["pending_payment", "paid"], "cancelled")).rejects.toMatchObject({
      code: "INVALID_STATE",
    });
  });

  it("결제 시간(30분)이 지난 주문은 자동 취소되고 재고 복구", async () => {
    const repo = createMemoryRepo();
    const v = await variantOf("slim-shoe-rack");
    const order = await repo.createOrder({
      userId: USER,
      orderNumber: "CH20261122-TEST000006",
      shipping,
      lines: [{ variantId: v.id, quantity: 1 }],
    });
    const { memoryState } = await import("@/server/repo/memory");
    memoryState().orders.find((o) => o.id === order.id)!.expiresAt = new Date(Date.now() - 1000).toISOString();
    expect(await repo.expirePendingOrders()).toBe(1);
    expect((await repo.getOrderByNumber("CH20261122-TEST000006"))?.status).toBe("expired");
    expect((await variantOf("slim-shoe-rack")).stock).toBe(3);
  });

  it("숨김 상품은 공개 목록에 안 나오고 관리자 목록에는 나옴", async () => {
    const repo = createMemoryRepo();
    const p = (await repo.getProductBySlug("stainless-tumbler"))!;
    await repo.saveProduct({ ...p, isPublished: false });
    expect((await repo.listProducts()).some((x) => x.id === p.id)).toBe(false);
    expect((await repo.listProducts({ includeUnpublished: true })).some((x) => x.id === p.id)).toBe(true);
  });

  it("검색: 한국어·영어 이름 부분 일치", async () => {
    const repo = createMemoryRepo();
    expect((await repo.listProducts({ q: "텀블러" })).map((p) => p.slug)).toContain("stainless-tumbler");
    expect((await repo.listProducts({ q: "tumbler" })).map((p) => p.slug)).toContain("stainless-tumbler");
  });
});
