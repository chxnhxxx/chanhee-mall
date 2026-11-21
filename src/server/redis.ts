import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { env, features } from "@/env";

/**
 * Upstash Redis: 레이트 리밋 + 공용 캐시.
 * 키가 없으면 프로세스 메모리로 대체합니다 (서버리스에서는 인스턴스끼리 공유되지 않으므로 로컬 전용).
 */
let _redis: Redis | undefined;
export function redis(): Redis | null {
  if (!features.upstash) return null;
  _redis ??= new Redis({ url: env.UPSTASH_REDIS_REST_URL!, token: env.UPSTASH_REDIS_REST_TOKEN! });
  return _redis;
}

type Bucket = "login" | "checkout" | "search" | "cart";
const RULES: Record<Bucket, { limit: number; windowSec: number }> = {
  login: { limit: 10, windowSec: 60 },
  checkout: { limit: 10, windowSec: 60 },
  search: { limit: 60, windowSec: 60 },
  cart: { limit: 60, windowSec: 60 },
};

const limiters = new Map<Bucket, Ratelimit>();
const g = globalThis as unknown as { __chmRl?: Map<string, { count: number; reset: number }> };
const memHits = () => (g.__chmRl ??= new Map());

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/** true = 허용, false = 너무 많은 요청 */
export async function rateLimit(bucket: Bucket, key: string): Promise<boolean> {
  if (process.env.DISABLE_RATE_LIMIT === "1") return true; // E2E 테스트용
  const rule = RULES[bucket];
  const r = redis();
  if (r) {
    let limiter = limiters.get(bucket);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: r,
        limiter: Ratelimit.slidingWindow(rule.limit, `${rule.windowSec} s`),
        prefix: `chm:rl:${bucket}`,
      });
      limiters.set(bucket, limiter);
    }
    const { success } = await limiter.limit(key);
    return success;
  }
  const now = Date.now();
  const k = `${bucket}:${key}`;
  const hit = memHits().get(k);
  if (!hit || hit.reset < now) {
    memHits().set(k, { count: 1, reset: now + rule.windowSec * 1000 });
    return true;
  }
  hit.count++;
  return hit.count <= rule.limit;
}

/**
 * 공용 데이터 캐시 (Redis). 공개 데이터에만 사용하고, 사용자별 데이터는 절대 넣지 않습니다.
 * Next.js "use cache" 는 서버리스 인스턴스 메모리에 머무르므로, 인스턴스 간에 나눠 쓰는 2차 캐시로 둡니다.
 */
export async function cachedJson<T>(key: string, ttlSec: number, load: () => Promise<T>): Promise<T> {
  const r = redis();
  if (!r) return load();
  try {
    const hit = await r.get<T>(`chm:cache:${key}`);
    if (hit !== null && hit !== undefined) return hit;
  } catch (e) {
    console.warn("[redis] get 실패, DB 로 진행", e);
  }
  const value = await load();
  r.set(`chm:cache:${key}`, value, { ex: ttlSec }).catch(() => {});
  return value;
}

export async function invalidateCache(prefix: string) {
  const r = redis();
  if (!r) return;
  let cursor = "0";
  do {
    const [next, keys] = await r.scan(cursor, { match: `chm:cache:${prefix}*`, count: 100 });
    cursor = String(next);
    if (keys.length) await r.del(...keys);
  } while (cursor !== "0");
}
