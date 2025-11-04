# MongoDB Basics (notes)

- Use the official `mongodb` Node.js driver for direct control and good TypeScript support.
- Create a single `MongoClient` and reuse it across the app to avoid connection storms.
- `db.collection(name)` returns a collection handle on which you can `find`, `insertOne`, `updateOne`, etc.
- Indexes:
  - Use unique indexes for deduplication (e.g., users.email).
  - Use a text index for full-text search across multiple fields.
- Health check: use `db.command({ ping: 1 })` to verify connectivity.
- Graceful shutdown: close MongoClient on SIGINT/SIGTERM to let connections close cleanly.
