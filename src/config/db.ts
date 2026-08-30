import mongoose from 'mongoose';
import { env } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  const cached = global.__mongooseCache ?? { conn: null, promise: null };
  global.__mongooseCache = cached;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.mongodbUri).then((connection) => {
      console.log('MongoDB connected');
      return connection;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
