import { describe, expect, it } from "vitest";
import { loginSchema, productFormSchema, shippingSchema, signupSchema } from "@/lib/schemas";

const shipping = {
  recipient: "홍길동",
  phone: "010-1234-5678",
  postcode: "06236",
  address1: "서울 강남구 테헤란로 1",
  address2: "101호",
  memo: "",
};

describe("입력 검증", () => {
  it("배송지: 정상 값 통과, 우편번호 5자리·전화번호 형식 검사", () => {
    expect(shippingSchema.safeParse(shipping).success).toBe(true);
    expect(shippingSchema.safeParse({ ...shipping, postcode: "1234" }).success).toBe(false);
    expect(shippingSchema.safeParse({ ...shipping, phone: "hello" }).success).toBe(false);
  });

  it("로그인/가입: 이메일 형식과 비밀번호 길이", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "김", email: "a@b.co", password: "short" }).success).toBe(false);
  });

  it("상품: 숫자 문자열을 숫자로 바꾸고, 옵션은 1개 이상", () => {
    const base = {
      slug: "new-item",
      categoryId: "11111111-1111-4111-8111-111111111111",
      nameKo: "새 상품",
      nameEn: "New item",
      descriptionKo: "",
      descriptionEn: "",
      price: "12000",
      images: [],
      isPublished: true,
      variants: [{ sku: "N-1", nameKo: "기본", nameEn: "Default", priceDelta: "0", stock: "5" }],
    };
    const ok = productFormSchema.parse(base);
    expect(ok.price).toBe(12000);
    expect(ok.variants[0].stock).toBe(5);
    expect(productFormSchema.safeParse({ ...base, variants: [] }).success).toBe(false);
    expect(productFormSchema.safeParse({ ...base, slug: "Bad Slug" }).success).toBe(false);
  });
});
