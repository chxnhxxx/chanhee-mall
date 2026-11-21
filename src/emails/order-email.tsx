import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { Order } from "@/lib/domain";
import { formatKRW } from "@/lib/pricing";

export type OrderEmailKind = "paid" | "shipped" | "cancelled" | "refunded";

const TITLES: Record<OrderEmailKind, string> = {
  paid: "주문이 완료되었습니다",
  shipped: "상품이 발송되었습니다",
  cancelled: "주문이 취소되었습니다",
  refunded: "환불이 완료되었습니다",
};

export function subjectFor(kind: OrderEmailKind, order: Order) {
  return `[chanhee-mall 데모] ${TITLES[kind]} (${order.orderNumber})`;
}

export default function OrderEmail({ kind, order, siteUrl }: { kind: OrderEmailKind; order: Order; siteUrl: string }) {
  return (
    <Html lang="ko">
      <Head />
      <Preview>{TITLES[kind]}</Preview>
      <Body style={{ backgroundColor: "#f6f6f6", fontFamily: "Apple SD Gothic Neo, Malgun Gothic, sans-serif" }}>
        <Container style={{ backgroundColor: "#ffffff", padding: "32px", margin: "24px auto", maxWidth: "560px" }}>
          <Text style={{ color: "#b45309", fontSize: "12px" }}>
            데모 사이트입니다. 실제 주문·결제는 처리되지 않습니다.
          </Text>
          <Heading as="h1" style={{ fontSize: "22px" }}>
            {TITLES[kind]}
          </Heading>
          <Text>주문번호: {order.orderNumber}</Text>
          <Section>
            {order.items.map((i) => (
              <Text key={i.id} style={{ margin: "4px 0" }}>
                {i.productNameKo} ({i.variantNameKo}) × {i.quantity} — {formatKRW(i.unitPrice * i.quantity)}
              </Text>
            ))}
          </Section>
          <Hr />
          <Text>배송비: {formatKRW(order.shippingFee)}</Text>
          <Text style={{ fontWeight: 700 }}>결제 금액: {formatKRW(order.totalAmount)}</Text>
          {kind === "shipped" && order.trackingNumber ? <Text>송장번호: {order.trackingNumber}</Text> : null}
          <Link href={`${siteUrl}/ko/orders/${order.orderNumber}`}>주문 상세 보기</Link>
        </Container>
      </Body>
    </Html>
  );
}
