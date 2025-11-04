/**
 * schema.ts
 * - Define SDL and resolvers
 * - Start tiny Query.hello to test the GraphQL pipeline
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { gql } from 'apollo-server-express';
// import type { IResolvers } from '@graphql-tools/utils'; // optional helper type
import type { GQLContext } from '../context';
import { Resolvers } from 'server/src/generated/graphql';

const sdl = readFileSync(join(__dirname, '..', 'graphql', 'schema.graphql'), 'utf-8');

export const typeDefs = gql(sdl);
/**
 * Resolvers: keep context typed. We avoid any in signatures.
 * For larger projects, split resolvers per domain.
 */
export const resolvers: Resolvers = {
  Query: {
    hello(_parent, args, _ctx) {
      // Example usage of context: access headers or auth later
      // const authHeader = ctx.req.headers.authorization;
      const who = args?.name ?? 'world';
      return `Hello, ${who}! (from GraphQL)`;
    },
  },
  Mutation: {},
};
