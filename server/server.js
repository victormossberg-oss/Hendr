const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());


// =========================
// HÄMTA ALLA HÄNDELSER
// =========================

app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        eventID AS id,
        title,
        description,
        category,
        status,
        created_at AS "createdAt"
      FROM Events
      ORDER BY created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte hämta händelser."
    });
  }
});

app.post("/api/events", async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      status
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO Events
      (title, description, category, status)
      VALUES ($1, $2, $3, $4)
      RETURNING
        eventID AS id,
        title,
        description,
        category,
        status,
        created_at AS "createdAt"
      `,
      [
        title,
        description,
        category,
        status
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Kunde inte skapa händelsen."
    });
  }
});


// =========================
// STARTA SERVERN
// =========================

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`HENDR API körs på http://localhost:${PORT}`);
});