/**
 * [쉬운 설명] 단위 테스트 도구(Vitest) 설정. `pnpm test` 가 tests/unit 폴더의 검사들을 이 설정으로 돌립니다.
 * 리뷰 순서: 9단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // "server-only" 는 서버 컴포넌트 밖에서 불리면 에러를 내므로 테스트에서는 빈 모듈로 바꿈
    alias: { "server-only": fileURLToPath(new URL("./tests/unit/empty.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
});
