/**
 * minimal dev entry. we'll replace this with Apollo/Express in Step 2
 */
import http from 'http';
import express from 'express';
import cors from 'cors';
import { uptime } from 'process';
import { ApolloServer } from 'apollo-server-express';
import { resolvers, typeDefs } from 'server/src/graphql/schema';
import { createContext } from 'server/src/context';
const port = process.env.PORT ?? 4000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
  'https://studio.apollographql.com',
];

async function startServer() {
  const app = express();
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/healthz', (_req, res) => res.json({ ok: true, uptime: uptime() }));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => createContext({ req, res } as any),
  });

  await server.start();

  server.applyMiddleware({ app: app as any, path: '/graphql', cors: false });

  const httpServer = http.createServer(app);
  httpServer.listen({ port }, () => {
    console.log(`Server ready at http://localhost:${port}${server.graphqlPath}`);
  });
}

startServer().catch(console.error);
