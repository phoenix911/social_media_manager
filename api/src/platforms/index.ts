// Platform registry — looked up by adapter from the `platform` enum.

import type { Platform } from "@smm/shared";
import type { PlatformAdapter } from "./types.ts";
import reddit from "./reddit.ts";
import linkedin from "./linkedin.ts";
import twitter from "./twitter.ts";
import instagram from "./instagram.ts";
import producthunt from "./producthunt.ts";

export const adapters: Record<Platform, PlatformAdapter> = {
  reddit,
  linkedin,
  twitter,
  instagram,
  producthunt,
};

export const getAdapter = (p: Platform): PlatformAdapter => {
  const a = adapters[p];
  if (!a) throw new Error(`no adapter for platform ${p}`);
  return a;
};
