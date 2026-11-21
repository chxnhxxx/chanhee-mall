import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/env";
import type { Database } from "@/types/supabase";

export type DB = SupabaseClient<Database>;

/**
 * 세 종류의 클라이언트
 *  - publicClient : 공개 키, 로그인 정보 없음 → 공개 상품 조회 ("use cache" 안에서도 사용 가능)
 *  - userClient   : 공개 키 + 쿠키 세션 → RLS 가 "이 사용자" 기준으로 적용
 *  - serviceClient: 비밀 키 → RLS 우회. 주문 생성·결제 처리·웹훅처럼 서버만 해야 하는 일에만 사용
 */
let _public: DB | undefined;
export function publicClient(): DB {
  _public ??= createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _public;
}

let _service: DB | undefined;
export function serviceClient(): DB {
  _service ??= createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}

export async function userClient(): Promise<DB> {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component 에서는 쿠키를 쓸 수 없음. 세션 갱신은 proxy.ts 가 담당하므로 무시해도 됨.
        }
      },
    },
  });
}
