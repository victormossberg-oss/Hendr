const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false
    })
  : new Pool({
      user: "postgres",
      host: "localhost",
      database: "Vadsker",
      password: "hejsanhoppsan12",
      port: 5432
    });

module.exports = pool;