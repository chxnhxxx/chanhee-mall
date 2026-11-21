import "server-only";
import { env, features } from "@/env";

/**
 * 토스페이먼츠 서버 API (코어 API v1).
 * - 승인: POST /v1/payments/confirm
 * - 취소: POST /v1/payments/{paymentKey}/cancel  (Idempotency-Key 헤더로 중복 취소 방지)
 * - 조회: GET  /v1/payments/{paymentKey}
 * 인증: Basic base64("{시크릿키}:")
 *
 * 키가 없으면 "모의 결제" 모드: 외부 호출 없이 성공 응답을 흉내 냅니다 (로컬 개발·E2E 전용).
 */
const BASE = "https://api.tosspayments.com";

export type TossPayment = {
  paymentKey: string;
  orderId: string;
  orderName?: string;
  status:
    "READY" | "IN_PROGRESS" | "WAITING_FOR_DEPOSIT" | "DONE" | "CANCELED" | "PARTIAL_CANCELED" | "ABORTED" | "EXPIRED";
  totalAmount: number;
  balanceAmount?: number;
  method?: string | null;
  approvedAt?: string | null;
};

export class TossError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const MOCK_PAYMENT_KEY_PREFIX = "mock_";
export const isMockMode = () => !features.toss;

function authHeader() {
  return `Basic ${Buffer.from(`${env.TOSS_SECRET_KEY}:`).toString("base64")}`;
}

async function call<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => ({}))) as T & { code?: string; message?: string };
  if (!res.ok) throw new TossError(body.code ?? "UNKNOWN", body.message ?? "토스 API 오류", res.status);
  return body;
}

export async function confirmPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossPayment> {
  if (isMockMode()) {
    if (!input.paymentKey.startsWith(MOCK_PAYMENT_KEY_PREFIX))
      throw new TossError("INVALID_KEY", "모의 결제 키 아님", 400);
    return {
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      status: "DONE",
      totalAmount: input.amount,
      method: "모의결제",
      approvedAt: new Date().toISOString(),
    };
  }
  return call<TossPayment>("/v1/payments/confirm", {
    method: "POST",
    body: JSON.stringify(input),
    idempotencyKey: `confirm-${input.orderId}`,
  });
}

export async function cancelPayment(input: {
  paymentKey: string;
  reason: string;
  idempotencyKey: string;
}): Promise<TossPayment> {
  if (isMockMode() || input.paymentKey.startsWith(MOCK_PAYMENT_KEY_PREFIX)) {
    return { paymentKey: input.paymentKey, orderId: "", status: "CANCELED", totalAmount: 0, balanceAmount: 0 };
  }
  return call<TossPayment>(`/v1/payments/${encodeURIComponent(input.paymentKey)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancelReason: input.reason }),
    idempotencyKey: input.idempotencyKey,
  });
}

export async function getPayment(paymentKey: string): Promise<TossPayment> {
  if (isMockMode()) throw new TossError("MOCK", "모의 모드에서는 조회 불가", 400);
  return call<TossPayment>(`/v1/payments/${encodeURIComponent(paymentKey)}`, { method: "GET" });
}
