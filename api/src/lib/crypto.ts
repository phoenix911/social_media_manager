// AES-GCM encryption for OAuth tokens at rest.
//
// Format: base64( <12-byte IV> || ciphertext || 16-byte tag )
// Key:    SMM_TOKEN_KEY env secret, 64 hex chars (256-bit key).
// Use:    encrypt(plaintext, env.SMM_TOKEN_KEY) and pair decrypt(...).

const enc = new TextEncoder();
const dec = new TextDecoder();

const importKey = async (hexKey: string): Promise<CryptoKey> => {
  if (!/^[0-9a-fA-F]{64}$/.test(hexKey)) {
    throw new Error("SMM_TOKEN_KEY must be 64 hex chars (256-bit)");
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = parseInt(hexKey.slice(i * 2, i * 2 + 2), 16);
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
};

const toB64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
};
const fromB64 = (b64: string): Uint8Array => {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};

export const encryptToken = async (plaintext: string, hexKey: string): Promise<string> => {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return toB64(out);
};

export const decryptToken = async (envelopeB64: string, hexKey: string): Promise<string> => {
  const key = await importKey(hexKey);
  const data = fromB64(envelopeB64);
  if (data.length < 13) throw new Error("encrypted token envelope too short");
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return dec.decode(pt);
};
