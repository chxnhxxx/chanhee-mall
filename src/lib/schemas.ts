import { z } from "zod";
import { MAX_QTY_PER_LINE } from "./pricing";

/**
 * 화면(React Hook Form)과 서버(Server Action)가 함께 쓰는 입력 검증 스키마.
 * 오류 메시지는 번역 키(validation.*)로 두고 화면에서 번역합니다.
 */
export const loginSchema = z.object({
  email: z.email("email"),
  password: z.string().min(1, "required"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "required").max(40),
  email: z.email("email"),
  password: z.string().min(8, "passwordMin").max(72),
});

export const shippingSchema = z.object({
  recipient: z.string().trim().min(1, "required").max(40),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9-]{9,14}$/, "phone"),
  postcode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "postcode"),
  address1: z.string().trim().min(1, "required").max(200),
  address2: z.string().trim().max(100).default(""),
  memo: z.string().trim().max(100).optional(),
});
export type ShippingInput = z.input<typeof shippingSchema>;

export const cartLineSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(0).max(MAX_QTY_PER_LINE),
});
export const guestLinesSchema = z.array(cartLineSchema.extend({ quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE) })).max(50);

export const returnSchema = z.object({
  orderNumber: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/),
  reason: z.string().trim().min(2, "required").max(200),
});

export const productFormSchema = z.object({
  id: z.uuid().optional(),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,80}$/, "영문 소문자·숫자·-만 2~80자"),
  categoryId: z.uuid("카테고리를 고르세요"),
  nameKo: z.string().trim().min(1, "필수").max(100),
  nameEn: z.string().trim().min(1, "필수").max(100),
  descriptionKo: z.string().trim().max(2000),
  descriptionEn: z.string().trim().max(2000),
  price: z.coerce.number<number>().int("정수").min(0).max(10_000_000),
  images: z.array(z.string().trim().min(1)).max(8),
  isPublished: z.boolean(),
  variants: z
    .array(
      z.object({
        id: z.uuid().optional(),
        sku: z.string().trim().min(1, "필수").max(40),
        nameKo: z.string().trim().min(1, "필수").max(60),
        nameEn: z.string().trim().min(1, "필수").max(60),
        priceDelta: z.coerce.number<number>().int().min(-1_000_000).max(1_000_000),
        stock: z.coerce.number<number>().int().min(0).max(100_000),
      }),
    )
    .min(1, "옵션은 1개 이상"),
});
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
