/**
 * client.ts
 * - Singleton MongoClient and helpers.
 * - Keeps one client across the app lifecycle (recommended).
 */
import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  const dbName = process.env.DB_NAME;
  if (!dbName) {
    throw new Error('DB_NAME is not set');
  }

  client = new MongoClient(MONGO_URI, {});

  await client.connect();
  db = client.db(dbName);
  console.log(`Connected to MongoDB: ${dbName}`);
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
