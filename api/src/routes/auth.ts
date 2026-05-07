// WebAuthn (passkey) auth routes.
//
// Flow:
//   1. POST /api/auth/email-otp/start  { email }    -> emails a 6-digit code
//   2. POST /api/auth/email-otp/finish { email, code }
//        -> upserts user, returns session cookie + flag if user has no
//           passkeys yet (UI should immediately invoke /webauthn/register)
//   3. POST /api/auth/webauthn/register/start (auth required)
//   4. POST /api/auth/webauthn/register/finish
//   5. POST /api/auth/webauthn/login/start  { email }    -> options
//   6. POST /api/auth/webauthn/login/finish { email, response }
//        -> session cookie
//   7. POST /api/auth/logout

import { Hono } from "hono";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { Env } from "../env.ts";
import { db, schema } from "../db/index.ts";
import { uuidv7 } from "../lib/ids.ts";
import { BadRequest, Unauthorized } from "../lib/errors.ts";
import { buildClearCookie, buildSetCookie, signSession } from "../lib/session.ts";
import { requireUser } from "../middleware/auth.ts";

const r = new Hono<{ Bindings: Env }>();

const rpName = "Social Media Manager";
const rpID = (env: Env): string => env.APP_HOSTNAME;
const origin = (env: Env): string => `https://${env.APP_HOSTNAME}`;

// b64url <-> Uint8Array (no Node Buffer; works in workerd).
const b64uEncode = (b: Uint8Array): string => {
  let s = "";
  for (const c of b) s += String.fromCharCode(c);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};
const b64uDecode = (s: string): Uint8Array => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replaceAll("-", "+").replaceAll("_", "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

type Challenge = typeof schema.authChallenges.$inferSelect;

const issueChallenge = async (
  env: Env,
  kind: "register" | "login" | "email_otp",
  challenge: string,
  opts: { email?: string; userId?: string; ttlSeconds?: number },
): Promise<void> => {
  const expires = new Date(Date.now() + (opts.ttlSeconds ?? 300) * 1000).toISOString();
  await db(env.DB).insert(schema.authChallenges).values({
    id: uuidv7(),
    kind,
    email: opts.email ?? null,
    userId: opts.userId ?? null,
    challenge,
    expiresAt: expires,
  });
};

// Find a challenge by (kind + match) and the literal challenge string,
// returning the row so the caller can mark it consumed after verify.
const findChallenge = async (
  env: Env,
  kind: Challenge["kind"],
  challenge: string,
  match: { email?: string; userId?: string },
): Promise<Challenge | null> => {
  const d = db(env.DB);
  const now = new Date().toISOString();
  const row = await d
    .select()
    .from(schema.authChallenges)
    .where(
      and(
        eq(schema.authChallenges.kind, kind),
        eq(schema.authChallenges.challenge, challenge),
        gt(schema.authChallenges.expiresAt, now),
        isNull(schema.authChallenges.consumedAt),
      ),
    )
    .get();
  if (!row) return null;
  if (match.email && row.email !== match.email) return null;
  if (match.userId && row.userId !== match.userId) return null;
  return row;
};

// Latest unconsumed challenge for a user/kind. Used when the verifier
// API needs the literal expected-challenge string up-front.
const latestChallenge = async (
  env: Env,
  kind: Challenge["kind"],
  match: { email?: string; userId?: string },
): Promise<Challenge | null> => {
  const d = db(env.DB);
  const now = new Date().toISOString();
  const conds = [
    eq(schema.authChallenges.kind, kind),
    gt(schema.authChallenges.expiresAt, now),
    isNull(schema.authChallenges.consumedAt),
  ];
  if (match.email) conds.push(eq(schema.authChallenges.email, match.email));
  if (match.userId) conds.push(eq(schema.authChallenges.userId, match.userId));
  const row = await d
    .select()
    .from(schema.authChallenges)
    .where(and(...conds))
    .orderBy(desc(schema.authChallenges.createdAt))
    .get();
  return row ?? null;
};

const consumeChallengeRow = async (env: Env, id: string): Promise<void> => {
  await db(env.DB)
    .update(schema.authChallenges)
    .set({ consumedAt: new Date().toISOString() })
    .where(eq(schema.authChallenges.id, id))
    .run();
};

// ── email OTP (first-device bootstrap) ─────────────────────────────

interface OtpStartBody { email?: string }
r.post("/email-otp/start", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as OtpStartBody;
  const email = body.email;
  if (!email) throw BadRequest("email required");
  const allow = (c.env.WEBAUTHN_ALLOWED_EMAILS ?? "*").trim();
  if (allow !== "*" && !allow.split(",").map((s) => s.trim().toLowerCase()).includes(email.toLowerCase())) {
    throw Unauthorized("email not on allowlist");
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await issueChallenge(c.env, "email_otp", code, { email, ttlSeconds: 600 });
  if (c.env.ENVIRONMENT === "dev") console.log(`[dev] OTP for ${email}: ${code}`);
  else if (c.env.RESEND_API_KEY && c.env.EMAIL_FROM) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: c.env.EMAIL_FROM,
        to: email,
        subject: "your smm sign-in code",
        text: `Your sign-in code is ${code}. Expires in 10 minutes.`,
      }),
    });
  }
  return c.json({ ok: true });
});

interface OtpFinishBody { email?: string; code?: string }
r.post("/email-otp/finish", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as OtpFinishBody;
  const { email, code } = body;
  if (!email || !code) throw BadRequest("email + code required");
  const row = await findChallenge(c.env, "email_otp", code, { email });
  if (!row) throw Unauthorized("invalid or expired code");
  await consumeChallengeRow(c.env, row.id);

  const d = db(c.env.DB);
  let user = await d.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!user) user = await d.insert(schema.users).values({ id: uuidv7(), email }).returning().get();
  if (!user) throw new Error("user upsert failed");

  const creds = await d.select().from(schema.userCredentials).where(eq(schema.userCredentials.userId, user.id)).all();
  const cookie = await signSession(c.env, user.id);
  c.header("Set-Cookie", buildSetCookie(c.env, cookie));
  return c.json({ user, hasPasskey: creds.length > 0 });
});

// ── WebAuthn registration (must be authenticated) ──────────────────

r.post("/webauthn/register/start", requireUser, async (c) => {
  const user = c.get("user");
  const d = db(c.env.DB);
  const existing = await d
    .select()
    .from(schema.userCredentials)
    .where(and(eq(schema.userCredentials.userId, user.id), isNull(schema.userCredentials.revokedAt)))
    .all();

  const opts = await generateRegistrationOptions({
    rpName,
    rpID: rpID(c.env),
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.name ?? user.email,
    attestationType: "none",
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
    excludeCredentials: existing.map((cr) => ({
      id: cr.credentialId,
      transports: cr.transports ? (cr.transports.split(",") as AuthenticatorTransportFuture[]) : undefined,
    })),
  });
  await issueChallenge(c.env, "register", opts.challenge, { userId: user.id });
  return c.json(opts);
});

interface RegisterFinishBody { response?: any; label?: string }
r.post("/webauthn/register/finish", requireUser, async (c) => {
  const user = c.get("user");
  const body = (await c.req.json().catch(() => ({}))) as RegisterFinishBody;
  const response = body.response;
  if (!response) throw BadRequest("response required");

  const pending = await latestChallenge(c.env, "register", { userId: user.id });
  if (!pending) throw BadRequest("no pending registration challenge");

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: pending.challenge,
    expectedOrigin: origin(c.env),
    expectedRPID: rpID(c.env),
  });
  if (!verification.verified || !verification.registrationInfo) throw BadRequest("registration verification failed");
  await consumeChallengeRow(c.env, pending.id);
  const cred = verification.registrationInfo.credential;

  await db(c.env.DB).insert(schema.userCredentials).values({
    id: uuidv7(),
    userId: user.id,
    credentialId: cred.id,
    publicKey: b64uEncode(cred.publicKey),
    signCount: cred.counter,
    transports: cred.transports?.length ? cred.transports.join(",") : null,
    label: body.label ?? null,
  });
  return c.json({ ok: true });
});

// ── WebAuthn login ─────────────────────────────────────────────────

interface LoginStartBody { email?: string }
r.post("/webauthn/login/start", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as LoginStartBody;
  const email = body.email;
  if (!email) throw BadRequest("email required");
  const d = db(c.env.DB);
  const user = await d.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!user) throw Unauthorized("no such user");
  const creds = await d
    .select()
    .from(schema.userCredentials)
    .where(and(eq(schema.userCredentials.userId, user.id), isNull(schema.userCredentials.revokedAt)))
    .all();
  if (creds.length === 0) throw Unauthorized("no passkeys for this account — sign in via email-OTP first");

  const opts = await generateAuthenticationOptions({
    rpID: rpID(c.env),
    allowCredentials: creds.map((cr) => ({
      id: cr.credentialId,
      transports: cr.transports ? (cr.transports.split(",") as AuthenticatorTransportFuture[]) : undefined,
    })),
    userVerification: "preferred",
  });
  await issueChallenge(c.env, "login", opts.challenge, { userId: user.id });
  return c.json(opts);
});

interface LoginFinishBody { email?: string; response?: any }
r.post("/webauthn/login/finish", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as LoginFinishBody;
  if (!body.email || !body.response) throw BadRequest("email + response required");
  const d = db(c.env.DB);
  const user = await d.select().from(schema.users).where(eq(schema.users.email, body.email)).get();
  if (!user) throw Unauthorized("no such user");

  const credentialId = body.response.id as string;
  const cred = await d.select().from(schema.userCredentials).where(eq(schema.userCredentials.credentialId, credentialId)).get();
  if (!cred || cred.userId !== user.id) throw Unauthorized("unknown credential");

  const pending = await latestChallenge(c.env, "login", { userId: user.id });
  if (!pending) throw BadRequest("no pending login challenge");

  const verification = await verifyAuthenticationResponse({
    response: body.response,
    expectedChallenge: pending.challenge,
    expectedOrigin: origin(c.env),
    expectedRPID: rpID(c.env),
    credential: {
      id: cred.credentialId,
      publicKey: b64uDecode(cred.publicKey),
      counter: cred.signCount,
      transports: cred.transports ? (cred.transports.split(",") as AuthenticatorTransportFuture[]) : undefined,
    },
    requireUserVerification: false,
  });
  if (!verification.verified) throw Unauthorized("verification failed");
  await consumeChallengeRow(c.env, pending.id);

  await d
    .update(schema.userCredentials)
    .set({ signCount: verification.authenticationInfo.newCounter, lastUsedAt: new Date().toISOString() })
    .where(eq(schema.userCredentials.id, cred.id))
    .run();

  const cookie = await signSession(c.env, user.id);
  c.header("Set-Cookie", buildSetCookie(c.env, cookie));
  return c.json({ user });
});

r.post("/logout", async (c) => {
  c.header("Set-Cookie", buildClearCookie(c.env));
  return c.json({ ok: true });
});

type AuthenticatorTransportFuture = "ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb";

export default r;
