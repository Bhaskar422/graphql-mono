/**
 * context.ts
 * - typed context object for GraphQL resolvers
 * - place to add user/session, DB references later
 */

import type { Request, Response } from 'express';
import { verifyToken } from 'server/src/auth/jwt';
import { Role } from 'server/src/generated/graphql';

export interface GQLUser {
  id: string;
  role: string;
}

export interface GQLContext {
  req: Request;
  res: Response;
  user?: GQLUser;
  // future: user?: { id: string; role: 'user' | 'admin' };
  // future: db: MongoClient | Db
}

/**
 * factory to build the context per-request.
 * Apollo will call this for each incoming request.
 */
export const createContext = ({ req, res }: { req: Request; res: Response }): GQLContext => {
  const ctx: GQLContext = { req, res };

  // Authorization header: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyToken<{ sub: string; role: Role }>(token);
      if (payload?.sub) {
        ctx.user = { id: payload.sub, role: payload.role ?? Role.User };
      }
    } catch (e) {
      // ignore invalid access token; resolvers should handle unauthenticated access
    }
  }
  return ctx;
};
