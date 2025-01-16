import { integer, pgSchema, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Use environment variable for schema name, fallback to production schema
const SCHEMA_NAME =
  process.env.DATABASE_SCHEMA || "reverse_image_dataset_generator_prod";

// Create a schema instance
export const schema = pgSchema(SCHEMA_NAME);

// Define tables within the schema
export const users = schema.table("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

// Create Zod schemas for type validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

// Export schema name for use in other parts of the application
export const getSchemaName = () => SCHEMA_NAME;
