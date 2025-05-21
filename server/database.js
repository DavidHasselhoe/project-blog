import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Needed for Railway's managed Postgres
  },
});

pool
  .connect()
  .then(() => {
    console.log("✅ Connected to PostgreSQL on Railway");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    throw err;
  });

export { pool };
