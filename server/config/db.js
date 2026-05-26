require("dotenv").config();
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
const useSsl = process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";

if (!connectionString && !process.env.PGHOST && !process.env.PGUSER && !process.env.PGDATABASE) {
  console.warn("PostgreSQL connection not configured. Set DATABASE_URL or PG_CONNECTION_STRING in .env for local testing.");
}

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

// Convert MySQL-style ? placeholders into PostgreSQL $1, $2, ... bindings.
// This lets existing query strings remain unchanged while using the pg client.
const adaptQuery = (text, params = []) => {
  let index = 0;
  const sql = text.replace(/\?/g, () => `$${++index}`);
  return { text: sql, values: params };
};

const query = async (text, params) => {
  const { text: sql, values } = adaptQuery(text, params);
  const result = await pool.query(sql, values);

  if (result.command === "INSERT" && result.rows && result.rows.length > 0) {
    result.insertId = result.rows[0].id;
    result.id = result.rows[0].id;
  }

  if (result.command === "SELECT" || result.command === "WITH") {
    return [result.rows, result.fields];
  }

  return [result, result.fields];
};

module.exports = { query, pool };
