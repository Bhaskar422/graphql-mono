/**
 * client.ts
 * - Singleton MongoClient and helpers.
 * - Keeps one client across the app lifecycle (recommended).
 */
import { MongoClient, Db } from 'mongodb';
import { env } from '../config/env';

const MONGO_URI = env.MONGO_URI;
const DB_NAME = env.DB_NAME;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not set');
}

if (!DB_NAME) {
  throw new Error('DB_NAME is not set');
}
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(MONGO_URI, {});

  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Connected to MongoDB: ${DB_NAME}`);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('Disconnected from MongoDB');
  }
}
