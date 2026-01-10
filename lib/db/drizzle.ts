import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

// Prevent multiple connections during hot reload in development
declare global {
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
  var __client: ReturnType<typeof postgres> | undefined;
}

let client: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle<typeof schema>>;

if (process.env.NODE_ENV === 'production') {
  // Production: Create connection with pooling limits
  client = postgres(process.env.POSTGRES_URL, {
    max: 10, // Maximum 10 connections
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout 10 seconds
  });
  db = drizzle(client, { schema });
} else {
  // Development: Reuse existing connection to prevent "too many clients"
  if (!global.__client) {
    global.__client = postgres(process.env.POSTGRES_URL, {
      max: 1, // Only 1 connection in development
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  if (!global.__db) {
    global.__db = drizzle(global.__client, { schema });
  }
  client = global.__client;
  db = global.__db;
}

export { client, db };
