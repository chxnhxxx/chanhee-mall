/**
 * [쉬운 설명] 코드 맞춤법 검사기(ESLint) 규칙. `pnpm lint` 를 실행하면 이 규칙으로 실수를 찾아줍니다.
 * 리뷰 순서: 1단계 (docs/REVIEW_GUIDE.md 참고)
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier, // 포맷 관련 규칙은 Prettier 에 맡김
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"]),
]);

export default eslintConfig;
