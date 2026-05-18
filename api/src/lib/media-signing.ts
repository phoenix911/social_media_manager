// Worker-proxy signed URLs for media objects.
//
// Format:  /api/media/public/<mediaId>?exp=<unix-ms>&sig=<base64url(hmac)>
// HMAC over: `${mediaId}.${exp}` with SESSION_SIGNING_KEY.
//
// Used by external services (e.g. Instagram's container API) that need
// to fetch our R2-stored media without an authenticated session. The
// HMAC + expiry pair gates access; the Worker streams the bytes via the
// existing env.MEDIA binding — no R2 access keys or signed S3 URLs.

import type { Env } from "../env.ts";

const enc = new TextEncoder();

const b64u = (b: ArrayBuffer | Uint8Array): string => {
  const bytes = b instanceof ArrayBuffer ? new Uint8Array(b) : b;
  let s = "";
  for (const c of bytes) s += String.fromCharCode(c);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const importKey = async (secret: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

const requireKey = (env: Env): string => {
  const k = env.SESSION_SIGNING_KEY;
  if (!k) throw new Error("SESSION_SIGNING_KEY not set");
  return k;
};

export const signMediaUrl = async (
  env: Env,
  mediaId: string,
  ttlSeconds = 86400,
): Promise<string> => {
  const exp = Date.now() + ttlSeconds * 1000;
  const payload = `${mediaId}.${exp}`;
  const key = await importKey(requireKey(env));
  const sig = b64u(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  const origin = env.APP_HOSTNAME ? `https://${env.APP_HOSTNAME}` : "";
  return `${origin}/api/media/public/${mediaId}?exp=${exp}&sig=${sig}`;
};

export const verifyMediaSig = async (
  env: Env,
  mediaId: string,
  exp: number,
  sig: string,
): Promise<boolean> => {
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const key = await importKey(requireKey(env));
  const expected = b64u(
    await crypto.subtle.sign("HMAC", key, enc.encode(`${mediaId}.${exp}`)),
  );
  return expected === sig;
};
