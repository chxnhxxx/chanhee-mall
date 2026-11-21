/**
 * [쉬운 설명] 환경변수 검사: 키가 없으면 데모 모드, 토스 실서비스 키(live_)는 거부.
 * 리뷰 순서: 9단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv(vars: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(vars)) vi.stubEnv(k, v);
  return import("@/env");
}

describe("환경변수 검사", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("키가 하나도 없으면 모든 외부 서비스가 꺼진 데모 모드", async () => {
    const { features } = await loadEnv({
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      SUPABASE_SECRET_KEY: "",
      NEXT_PUBLIC_TOSS_CLIENT_KEY: "",
      TOSS_SECRET_KEY: "",
    });
    expect(features.supabase).toBe(false);
    expect(features.toss).toBe(false);
  });

  it("토스 실서비스 키(live_)는 거부", async () => {
    await expect(loadEnv({ TOSS_SECRET_KEY: "live_sk_xxx" })).rejects.toThrow(/test_/);
  });

  it("Supabase 키 3개가 모두 있으면 Supabase 모드", async () => {
    const { features } = await loadEnv({
      DATA_BACKEND: "auto",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
      SUPABASE_SECRET_KEY: "sb_secret_x",
    });
    expect(features.supabase).toBe(true);
  });
});
