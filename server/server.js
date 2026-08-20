const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

require("dotenv").config();

const pool = require("./db");

const app = express();


// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// =========================
// BILDUPPLADDNING
// =========================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `${Date.now()}${extension}`;

    cb(null, filename);
  }
});

const upload = multer({
  storage: storage
});


// =========================
// HÄMTA ALLA HÄNDELSER
// =========================

app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        e.eventID AS id,
        e.title,
        e.description,
        e.category,
        e.status,
        e.created_at AS "createdAt",
        e.image_url AS "imageUrl",
        e.latitude,
        e.longitude,

        COUNT(DISTINCT o.observationID)
          AS "observationCount",

        COUNT(DISTINCT ec.confirmationID)
          AS "confirmationCount"

      FROM Events e

      LEFT JOIN Observations o
        ON o.eventID = e.eventID

      LEFT JOIN EventConfirmations ec
        ON ec.eventID = e.eventID

      GROUP BY
        e.eventID

      ORDER BY
        e.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Kunde inte hämta händelser."
    });
  }
});


// =========================
// SKAPA NY HÄNDELSE
// =========================

app.post(
  "/api/events",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        status,
        latitude,
        longitude
      } = req.body;

      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const result = await pool.query(
        `
        INSERT INTO Events
        (
          title,
          description,
          category,
          status,
          image_url,
          latitude,
          longitude
        )

        VALUES
        ($1, $2, $3, $4, $5, $6, $7)

        RETURNING
          eventID AS id,
          title,
          description,
          category,
          status,
          created_at AS "createdAt",
          image_url AS "imageUrl",
          latitude,
          longitude
        `,
        [
          title,
          description,
          category,
          status,
          imageUrl,
          latitude || null,
          longitude || null
        ]
      );

      res.status(201).json(
        result.rows[0]
      );

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Kunde inte skapa händelsen."
      });
    }
  }
);


// =========================
// SKAPA OBSERVATION
// =========================

app.post(
  "/api/observations",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        userID,
        eventID,
        description,
        latitude,
        longitude
      } = req.body;

      const imageUrl = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const result = await pool.query(
        `
        INSERT INTO Observations
        (
          userID,
          eventID,
          description,
          image_url,
          latitude,
          longitude
        )

        VALUES
        ($1, $2, $3, $4, $5, $6)

        RETURNING
          observationID AS id,
          userID,
          eventID,
          description,
          image_url AS "imageUrl",
          created_at AS "createdAt",
          latitude,
          longitude
        `,
        [
          userID,
          eventID,
          description,
          imageUrl,
          latitude || null,
          longitude || null
        ]
      );

      res.status(201).json(
        result.rows[0]
      );

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Kunde inte skapa observationen."
      });
    }
  }
);


// =========================
// HÄMTA OBSERVATIONER
// FÖR ETT EVENT
// =========================

app.get(
  "/api/events/:eventID/observations",
  async (req, res) => {
    try {
      const { eventID } =
        req.params;

      const result = await pool.query(
        `
        SELECT
          observationID AS id,
          userID,
          eventID,
          description,
          image_url AS "imageUrl",
          created_at AS "createdAt",
          latitude,
          longitude

        FROM Observations

        WHERE eventID = $1

        ORDER BY
          created_at DESC
        `,
        [eventID]
      );

      res.json(result.rows);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Kunde inte hämta observationerna."
      });
    }
  }
);


// =========================
// BEKRÄFTA / TA BORT
// BEKRÄFTELSE
// =========================

app.post(
  "/api/events/:eventID/confirm",
  async (req, res) => {
    try {
      const { eventID } =
        req.params;

      const { userID } =
        req.body;


      // =========================
      // KONTROLLERA OM
      // BEKRÄFTELSEN FINNS
      // =========================

      const existing =
        await pool.query(
          `
          SELECT
            confirmationID

          FROM EventConfirmations

          WHERE eventID = $1
          AND userID = $2
          `,
          [
            eventID,
            userID
          ]
        );


      // =========================
      // TA BORT BEKRÄFTELSE
      // =========================

      if (existing.rows.length > 0) {

        await pool.query(
          `
          DELETE FROM EventConfirmations

          WHERE eventID = $1
          AND userID = $2
          `,
          [
            eventID,
            userID
          ]
        );

        return res.json({
          confirmed: false
        });
      }


      // =========================
      // LÄGG TILL BEKRÄFTELSE
      // =========================

      const result =
        await pool.query(
          `
          INSERT INTO EventConfirmations
          (
            eventID,
            userID
          )

          VALUES
          ($1, $2)

          RETURNING
            confirmationID AS id,
            eventID,
            userID,
            created_at AS "createdAt"
          `,
          [
            eventID,
            userID
          ]
        );


      res.status(201).json({
        confirmed: true,
        confirmation:
          result.rows[0]
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Kunde inte ändra bekräftelsen."
      });
    }
  }
);


// =========================
// KONTROLLERA OM ANVÄNDAREN
// HAR BEKRÄFTAT EVENTET
// =========================

app.get(
  "/api/events/:eventID/confirmation",
  async (req, res) => {
    try {
      const { eventID } =
        req.params;

      // Tillfällig testanvändare
      const userID = 1;

      const result =
        await pool.query(
          `
          SELECT
            confirmationID

          FROM EventConfirmations

          WHERE eventID = $1
          AND userID = $2
          `,
          [
            eventID,
            userID
          ]
        );


      res.json({
        confirmed:
          result.rows.length > 0
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Kunde inte kontrollera bekräftelsen."
      });
    }
  }
);


// =========================
// STARTA SERVERN
// =========================

const PORT = 3000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `HENDR API körs på port ${PORT}`
    );
  }
);