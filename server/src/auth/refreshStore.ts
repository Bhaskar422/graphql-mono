/**
 * refreshStore.ts
 * - Minimal storage for issued refresh tokens to support revocation.
 * - Structure: { jti, userId, expiresAt }
 *
 * NOTE: This is minimal for learning. In production you might store hashed jti, TTL indexes, rotate tokens, etc.
 */
import { getDb } from '../db/client';

const COLLECTION = 'refreshTokens';

export async function saveRefreshToken(jti: string, userId: string, expiresAt: Date) {
  const db = getDb();
  await db.collection(COLLECTION).insertOne({ jti, userId, expiresAt });
}

export async function revokeRefreshToken(jti: string) {
  const db = getDb();
  await db.collection(COLLECTION).deleteOne({ jti });
}

export async function isRefreshTokenValid(jti: string, userId: string) {
  const db = getDb();
  const doc = await db.collection(COLLECTION).findOne({ jti, userId });
  return !!doc;
}
