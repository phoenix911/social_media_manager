// Cloudflare Access JWT verification.
//
// Every request to api.smm.<domain> is gated by CF Access. Access
// injects two values:
//   - cookie: CF_Authorization
//   - header: Cf-Access-Jwt-Assertion  ← we use this
// We verify the JWT signature against the team JWKS (cached) and
// trust the resulting `email` claim.

import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose";

export interface AccessClaims extends JWTPayload {
  email?: string;
  identity_nonce?: string;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

const getJwks = (team: string) => {
  const url = `https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`;
  let jwks = jwksCache.get(team);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(url));
    jwksCache.set(team, jwks);
  }
  return jwks;
};

export const verifyAccess = async (
  token: string,
  team: string,
  audience: string,
): Promise<AccessClaims> => {
  const jwks = getJwks(team);
  const { payload } = await jwtVerify(token, jwks, {
    issuer: `https://${team}.cloudflareaccess.com`,
    audience,
  });
  if (!payload.email) throw new Error("CF Access JWT missing email claim");
  return payload as AccessClaims;
};
