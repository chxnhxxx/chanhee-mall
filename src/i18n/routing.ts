import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en"],
  defaultLocale: "ko",
  localePrefix: "always", // /ko/..., /en/...
});

export type AppLocale = (typeof routing.locales)[number];
