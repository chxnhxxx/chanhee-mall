import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ko from "../../messages/ko.json";

function keys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("번역 파일", () => {
  it("한국어와 영어의 키가 똑같음", () => {
    expect(keys(en).sort()).toEqual(keys(ko).sort());
  });
});
