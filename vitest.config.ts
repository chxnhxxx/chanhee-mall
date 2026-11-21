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
