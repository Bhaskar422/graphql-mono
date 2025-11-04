/**
 * context.ts
 * - typed context object for GraphQL resolvers
 * - place to add user/session, DB references later
 */

import type { Request, Response } from 'express';

export interface GQLContext {
  req: Request;
  res: Response;
  // future: user?: { id: string; role: 'user' | 'admin' };
  // future: db: MongoClient | Db
}

/**
 * factory to build the context per-request.
 * Apollo will call this for each incoming request.
 */
export const createContext = ({ req, res }: { req: Request; res: Response }): GQLContext => {
  return { req, res };
};
