/**
 * [쉬운 설명] 배송지 입력 양식과 '결제하기로 이동' 버튼. 주소 검색은 다음(카카오) 우편번호 팝업을 씁니다.
 * 리뷰 순서: 6단계 (docs/REVIEW_GUIDE.md 참고)
 */
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import Script from "next/script";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { formatKRW } from "@/lib/pricing";
import { type ShippingInput, shippingSchema } from "@/lib/schemas";
import { placeOrderAction } from "@/server/actions/orders";
import type { PricedCart } from "@/server/cart";

type DaumPostcodeData = { zonecode: string; roadAddress: string; jibunAddress: string; buildingName?: string };
declare global {
  interface Window {
    daum?: { Postcode: new (opts: { oncomplete: (d: DaumPostcodeData) => void }) => { open: () => void } };
  }
}

export function CheckoutForm({ cart, defaultRecipient }: { cart: PricedCart; defaultRecipient: string }) {
  const t = useTranslations("checkout");
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  const tc = useTranslations("cart");
  const locale = useLocale() as "ko" | "en";
  const router = useRouter();
  const [pending, start] = useTransition();

  const form = useForm<ShippingInput>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { recipient: defaultRecipient, phone: "", postcode: "", address1: "", address2: "", memo: "" },
  });
  const errors = form.formState.errors;

  useEffect(() => {
    track("begin_checkout", {
      value: cart.totalAmount,
      items: cart.lines.map((l) => ({
        item_id: l.productId,
        item_name: l.productNameKo,
        item_variant: l.variantNameKo,
        price: l.unitPrice,
        quantity: l.quantity,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ▶ '주소 검색' 버튼 → 다음 우편번호 팝업 → 고른 주소를 입력칸에 채움
  function openPostcode() {
    if (!window.daum?.Postcode) {
      toast.error("주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    new window.daum.Postcode({
      oncomplete: (d) => {
        form.setValue("postcode", d.zonecode, { shouldValidate: true });
        form.setValue("address1", d.roadAddress || d.jibunAddress, { shouldValidate: true });
        document.getElementById("address2")?.focus();
      },
    }).open();
  }

  // ▶ 입력값 검사를 통과하면 서버에 주문 생성을 요청하고, 받은 주문번호의 결제 화면으로 이동
  const onSubmit = form.handleSubmit((values) => {
    start(async () => {
      const res = await placeOrderAction(values);
      if (!res.ok) {
        toast.error(te(res.code as never));
        return;
      }
      toast.success(t("orderCreated"));
      router.push(`/checkout/pay/${res.data.orderNumber}`);
    });
  });

  const field = (name: keyof ShippingInput, label: string, props: React.ComponentProps<"input"> = {}) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...props} {...form.register(name)} aria-invalid={!!errors[name]} />
      {errors[name]?.message ? <p className="text-xs text-destructive">{tv(errors[name]!.message as never)}</p> : null}
    </div>
  );

  return (
    <>
      <Script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]" noValidate>
        <section className="flex flex-col gap-4 rounded-xl border p-4">
          <h2 className="font-bold">{t("shipping")}</h2>
          {field("recipient", t("recipient"), { autoComplete: "name" })}
          {field("phone", t("phone"), { autoComplete: "tel", inputMode: "tel", placeholder: "010-1234-5678" })}
          <div className="flex items-end gap-2">
            <div className="flex-1">{field("postcode", t("postcode"), { readOnly: true, placeholder: "12345" })}</div>
            <Button type="button" variant="outline" onClick={openPostcode} className={errors.postcode ? "mb-5" : ""}>
              {t("findAddress")}
            </Button>
          </div>
          {field("address1", t("address1"), { readOnly: true })}
          {field("address2", t("address2"), { autoComplete: "address-line2" })}
          {field("memo", t("memo"))}
        </section>

        <aside className="flex h-fit flex-col gap-2 rounded-xl border p-4 text-sm">
          <h2 className="font-bold">{t("summary")}</h2>
          <ul className="flex flex-col gap-1">
            {cart.lines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-2">
                <span className="truncate">
                  {locale === "en" ? l.productNameEn : l.productNameKo} × {l.quantity}
                </span>
                <span>{formatKRW(l.lineTotal, locale)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t pt-2">
            <span>{tc("itemsAmount")}</span>
            <span>{formatKRW(cart.itemsAmount, locale)}</span>
          </div>
          <div className="flex justify-between">
            <span>{tc("shippingFee")}</span>
            <span>{formatKRW(cart.shippingFee, locale)}</span>
          </div>
          <Button type="submit" size="lg" disabled={pending} className="mt-2" data-testid="place-order">
            {pending ? t("processing") : t("placeOrder", { amount: formatKRW(cart.totalAmount, locale) })}
          </Button>
          <Link href="/cart" className="text-center text-xs text-muted-foreground underline">
            {t("back")}
          </Link>
        </aside>
      </form>
    </>
  );
}
