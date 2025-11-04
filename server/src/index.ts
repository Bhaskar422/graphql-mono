/**
 * minimal dev entry. we'll replace this with Apollo/Express in Step 2
 */

// Import modules that depend on env vars AFTER dotenv.config()
import http from 'http';
import express from 'express';
import cors from 'cors';
import { uptime } from 'process';
import { ApolloServer } from 'apollo-server-express';
import cookieParser from 'cookie-parser';
import { resolvers, typeDefs } from 'server/src/graphql/schema';
import { createContext } from 'server/src/context';
import { closeMongo, connectMongo } from 'server/src/db/client';
import { ensureIndexes } from 'server/src/db/indexHelper';
import { env } from 'server/src/config/env';
const port = env.PORT;
if (!port) {
  throw new Error('PORT is not set');
}

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
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  try {
    await connectMongo();
    await ensureIndexes();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

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
    console.log('Server is running on port', port);
    console.log(`Server ready at http://localhost:${port}${server.graphqlPath}`);
  });

  const shutdown = async () => {
    console.log('Received shutdown signal, closing server..');
    await server.stop();
    httpServer.close(async err => {
      if (err) {
        console.log('HTTP server close error:', err);
        process.exit(1);
      }
      await closeMongo();
      console.log('MongoDB closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch(console.error);
