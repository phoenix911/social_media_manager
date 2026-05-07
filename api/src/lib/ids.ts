// UUIDv7 generator for primary keys.
//
// Layout (RFC 9562):
//   - 48 bits Unix-millisecond timestamp
//   - 4 bits version (0111)
//   - 12 bits random
//   - 2 bits variant (10)
//   - 62 bits random
//
// Time-ordered prefix → SQLite indexed scans stay sequential, so
// pagination and sort-by-recency are cheap.

export const uuidv7 = (): string => {
  const ms = Date.now();
  const rnd = crypto.getRandomValues(new Uint8Array(10));

  // bytes[0..5] = timestamp (big-endian, 48-bit)
  const bytes = new Uint8Array(16);
  bytes[0] = (ms / 2 ** 40) & 0xff;
  bytes[1] = (ms / 2 ** 32) & 0xff;
  bytes[2] = (ms / 2 ** 24) & 0xff;
  bytes[3] = (ms / 2 ** 16) & 0xff;
  bytes[4] = (ms / 2 ** 8) & 0xff;
  bytes[5] = ms & 0xff;

  // bytes[6..15] = random
  for (let i = 0; i < 10; i++) bytes[6 + i] = rnd[i]!;

  // version 7 (high nibble of byte 6)
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  // variant 10 (high two bits of byte 8)
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const isUuid = (s: unknown): s is string =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
