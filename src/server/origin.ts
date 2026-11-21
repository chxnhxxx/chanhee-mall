import "server-only";
import { headers } from "next/headers";
import { env } from "@/env";

/** 현재 요청의 사이트 주소. NEXT_PUBLIC_SITE_URL 이 있으면 그 값을 우선 (Vercel 미리보기 주소에서도 동작하도록 헤더로 보완) */
export async function requestOrigin(): Promise<string> {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
