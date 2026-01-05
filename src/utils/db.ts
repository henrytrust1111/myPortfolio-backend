import mongoose from 'mongoose';

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var _mongoClientPromise: any;
}

let cached: Cached = (global as any)._mongoClientPromise || { conn: null, promise: null };

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set.');
    }

    const opts: mongoose.ConnectOptions = {
      // disable mongoose buffering so operations fail fast when disconnected
      bufferCommands: false,
      // server selection timeout to fail quickly if DB unreachable
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    } as mongoose.ConnectOptions;

    cached.promise = mongoose.connect(MONGODB_URI || '', opts).then((m) => m);
    (global as any)._mongoClientPromise = cached;
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export function clearCachedConnection() {
  cached = { conn: null, promise: null };
  (global as any)._mongoClientPromise = cached;
}
