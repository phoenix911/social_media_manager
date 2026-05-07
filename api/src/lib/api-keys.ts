// API-key helpers. Plaintext shape: `smm_<32 hex bytes>`.
//   - prefix (UI hint) = first 12 chars: `smm_` + 8
//   - storage = SHA-256(plaintext) hex, unique
//
// Hashing is single-round SHA-256 (no salt, no pbkdf2): the secret
// itself is 256 bits of entropy, not a password, so a slow KDF buys
// nothing while making every authed request slower.

const enc = new TextEncoder();

const toHex = (b: ArrayBuffer): string => {
  const bytes = new Uint8Array(b);
  let s = "";
  for (const c of bytes) s += c.toString(16).padStart(2, "0");
  return s;
};

export const generateApiKey = (): { plaintext: string; prefix: string } => {
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  const hex = Array.from(raw, (b) => b.toString(16).padStart(2, "0")).join("");
  const plaintext = `smm_${hex}`;
  return { plaintext, prefix: plaintext.slice(0, 12) };
};

export const hashApiKey = async (plaintext: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(plaintext));
  return toHex(digest);
};

// Constant-time compare so timing leaks don't reveal hash bits.
// Both sides are hex-encoded SHA-256 digests so always 64 chars.
export const constTimeEq = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
