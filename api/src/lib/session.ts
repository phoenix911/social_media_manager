// HMAC-signed session cookies for the WebAuthn auth mode.
// Format:  <userId>.<expEpoch>.<base64url(HMAC-SHA256(userId|exp))>

import type { Env } from "../env.ts";

const enc = new TextEncoder();

const b64u = (b: ArrayBuffer | Uint8Array): string => {
  const bytes = b instanceof ArrayBuffer ? new Uint8Array(b) : b;
  let s = "";
  for (const c of bytes) s += String.fromCharCode(c);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const importKey = async (secret: string): Promise<CryptoKey> => {
  const raw = enc.encode(secret);
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
};

const requireKey = (env: Env): string => {
  const k = env.SESSION_SIGNING_KEY;
  if (!k) throw new Error("SESSION_SIGNING_KEY not set — generate with `openssl rand -base64 32`");
  return k;
};

export const signSession = async (env: Env, userId: string): Promise<string> => {
  const ttl = Number(env.SESSION_TTL_SECONDS ?? "604800");
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const payload = `${userId}.${exp}`;
  const key = await importKey(requireKey(env));
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${payload}.${b64u(sig)}`;
};

export const verifySession = async (
  env: Env,
  cookie: string,
): Promise<{ userId: string } | null> => {
  const parts = cookie.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  const key = await importKey(requireKey(env));
  const expected = await crypto.subtle.sign("HMAC", key, enc.encode(`${userId}.${expStr}`));
  if (b64u(expected) !== sig) return null;
  return { userId };
};

export const cookieName = (env: Env): string => env.SESSION_COOKIE_NAME ?? "smm_sess";

export const buildSetCookie = (env: Env, value: string): string => {
  const name = cookieName(env);
  const ttl = Number(env.SESSION_TTL_SECONDS ?? "604800");
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttl}`;
};

export const buildClearCookie = (env: Env): string => {
  const name = cookieName(env);
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
};

export const readCookie = (header: string | undefined, name: string): string | null => {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
};
