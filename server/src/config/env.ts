import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root (one level up from server/)
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

// Export validated env vars
export const env = {
  PORT: process.env.PORT ?? '4000',
  MONGO_URI: process.env.MONGO_URI ?? '',
  DB_NAME: process.env.DB_NAME ?? '',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES ?? '',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES ?? '',
  JWT_ISSUER: process.env.JWT_ISSUER ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  REFRESH_TOKEN_COOKIE_NAME: process.env.REFRESH_TOKEN_COOKIE_NAME ?? '',
};

// Validate required vars
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in .env file');
}
