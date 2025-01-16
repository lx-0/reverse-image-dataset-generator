import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Get schema name from environment variable or use default
const schemaName =
  process.env.DATABASE_SCHEMA || "reverse_image_dataset_generator_prod";

// Create a new pool instance with SSL if enabled
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? {
          rejectUnauthorized: false, // Required for some cloud providers
        }
      : false,
});

// Create the drizzle instance with schema
export const db = drizzle(pool, { schema });
