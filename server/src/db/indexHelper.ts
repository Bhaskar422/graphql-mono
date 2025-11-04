/**
 * indexHelper.ts
 * - Utility to create indexes (call from scripts or CI)
 * - Example: text index for posts, unique index for users.email
 */

import { getDb } from './client';

export async function ensureIndexes() {
  const db = getDb();

  await db.collection('users').createIndex({ email: 1 }, { unique: true });

  await db
    .collection('posts')
    .createIndex(
      { title: 'text', body: 'text', tags: 'text' },
      { name: 'posts_text_idx', default_language: 'english' },
    );

  await db.collection('refreshTokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  console.log('Indexes created successfully');
}
