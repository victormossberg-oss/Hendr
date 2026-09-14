require("dotenv").config({ path: "./server/.env" });

const { runner } = require("node-pg-migrate");

runner({

  databaseUrl: process.env.DATABASE_URL,

  dir: "migrations",

  direction: "up",

  count: Infinity,

  migrationsTable: "pgmigrations",

  ssl: {
    rejectUnauthorized: false
  },

});