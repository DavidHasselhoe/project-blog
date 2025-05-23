import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});

pool
  .connect()
  .then(() => {
    const env = process.env.NODE_ENV || "development";
    console.log(`Connected to PostgreSQL (${env} environment)`);
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    throw err;
  });

export { pool };
