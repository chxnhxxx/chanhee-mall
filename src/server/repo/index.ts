import "server-only";
import { features } from "@/env";
import { createMemoryRepo } from "./memory";
import { createSupabaseRepo } from "./supabase";
import type { Repo } from "./types";

let _repo: Repo | undefined;

/** 환경변수에 따라 Supabase 또는 메모리 저장소를 고름 */
export function repo(): Repo {
  _repo ??= features.supabase ? createSupabaseRepo() : createMemoryRepo();
  return _repo;
}

export { RepoError } from "./types";
export type { Repo, ProductInput } from "./types";
