/**
 * jwt.ts
 * - helpers to sign and verify access & refresh tokens.
 * - access tokens are compact (short-lived); refresh tokens include a tokenId for revocation.
 */
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

import { env } from '../config/env';

/**
 * Access payload will contain minimal info (sub, role)
 */
export function signAccessToken(payload: { sub: string; role: string }) {
  const options = {
    expiresIn: env.JWT_ACCESS_EXPIRES,
    issuer: env.JWT_ISSUER,
  };
  return jwt.sign(payload, env.JWT_SECRET, options as SignOptions);
}

/**
 * Refresh tokens include a tokenId (jti) so we can revoke/rotate them.
 */
export function signRefreshToken(payload: { sub: string; role: string }) {
  const jti = randomUUID();
  const token = jwt.sign({ ...payload, jti }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
    issuer: env.JWT_ISSUER,
  } as SignOptions);
  return { token, jti };
}

export function verifyToken<T = any>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET) as T;
}
