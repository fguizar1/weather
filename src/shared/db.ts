import "dotenv/config";

import { Pool } from "pg";

/**
 * PostgreSQL connection pool configuration.
 *
 * Retrieves the database connection parameters from environment
 * variables defined in the application's configuration.
 *
 * The connection pool manages and reuses database connections
 * to optimize database operations and resource utilization.
 *
 * @constant
 * @type {Pool}
 */
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
