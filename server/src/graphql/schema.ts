/**
 * schema.ts
 * - Define SDL and resolvers
 * - Start tiny Query.hello to test the GraphQL pipeline
 */

import { gql } from 'apollo-server-express';
import type { IResolvers } from '@graphql-tools/utils'; // optional helper type
import type { GQLContext } from '../context';

export const typeDefs = gql`
  """
  Root Query type
  """
  type Query {
    "A simple health query for GraphQL clients"
    hello(name: String): String!
  }
`;

/**
 * Resolvers: keep context typed. We avoid any in signatures.
 * For larger projects, split resolvers per domain.
 */
export const resolvers: IResolvers = {
  Query: {
    hello(_: unknown, args: { name?: string }, ctx: GQLContext): string {
      // Example usage of context: access headers or auth later
      // const authHeader = ctx.req.headers.authorization;
      const who = args?.name ?? 'world';
      return `Hello, ${who}! (from GraphQL)`;
    },
  },
};
