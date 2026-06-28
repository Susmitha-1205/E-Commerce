import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER;
const password = process.env.SQL_ADMIN_PASSWORD;

if (!sqlHost || !sqlDbName || !user || !password) {
  // Graceful fallback if not loaded in build environment
  console.warn("Missing database environment variables for drizzle.config.ts. Using fallbacks.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    host: sqlHost || "localhost",
    user: user || "postgres",
    password: password || "postgres",
    database: sqlDbName || "postgres",
    ssl: false,
  },
  verbose: true,
});
