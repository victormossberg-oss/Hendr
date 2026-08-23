const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const axios = require("axios");

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
// HÄMTA PLATS FRÅN KOORDINATER
// =========================

async function getLocationName(
  latitude,
  longitude
) {

  if (
    latitude == null ||
    longitude == null
  ) {
    return null;
  }

  try {

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/reverse",
      {
        params: {
          lat: latitude,
          lon: longitude,
          format: "json",
          zoom: 10,
          addressdetails: 1
        },

        headers: {
          "User-Agent":
            "HENDR/1.0"
        }
      }
    );


    const address =
      response.data.address || {};


    console.log(
      "Nominatim address:",
      address
    );


    return (
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      null
    );

  } catch (error) {

    console.error(
      "Kunde inte hämta plats:",
      error.message
    );

    return null;
  }
}


// =========================
// HÄMTA ALLA HÄNDELSER
// =========================

app.get(
  "/api/events",
  async (req, res) => {

    try {

      const result =
        await pool.query(`
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


            COUNT(
              DISTINCT o.observationID
            ) AS "observationCount",


            COUNT(
              DISTINCT ec.confirmationID
            ) AS "confirmationCount"


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


      // =========================
      // HÄMTA ORT
      // =========================

      const eventsWithLocation =
        await Promise.all(

          result.rows.map(
            async (event) => {

              const location =
                await getLocationName(
                  event.latitude,
                  event.longitude
                );


              return {
                ...event,
                location
              };

            }
          )

        );


      res.json(
        eventsWithLocation
      );


    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "Kunde inte hämta händelser."
      });

    }

  }
);


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


      // =========================
      // KONVERTERA KOORDINATER
      // =========================

      const parsedLatitude =
        latitude !== undefined &&
        latitude !== ""
          ? Number(latitude)
          : null;


      const parsedLongitude =
        longitude !== undefined &&
        longitude !== ""
          ? Number(longitude)
          : null;


      console.log(
        "Ny händelse - koordinater:",
        {
          latitude:
            parsedLatitude,

          longitude:
            parsedLongitude
        }
      );


      // =========================
      // BILD
      // =========================

      const imageUrl =
        req.file
          ? `/uploads/${req.file.filename}`
          : null;


      // =========================
      // SPARA HÄNDELSE
      // =========================

      const result =
        await pool.query(
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
            parsedLatitude,
            parsedLongitude
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


      const parsedLatitude =
        latitude !== undefined &&
        latitude !== ""
          ? Number(latitude)
          : null;


      const parsedLongitude =
        longitude !== undefined &&
        longitude !== ""
          ? Number(longitude)
          : null;


      const imageUrl =
        req.file
          ? `/uploads/${req.file.filename}`
          : null;


      const result =
        await pool.query(
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
            parsedLatitude,
            parsedLongitude
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

      const {
        eventID
      } = req.params;


      const result =
        await pool.query(
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


      res.json(
        result.rows
      );


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

      const {
        eventID
      } = req.params;


      const {
        userID
      } = req.body;


      // =========================
      // KONTROLLERA BEKRÄFTELSE
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
      // TA BORT
      // =========================

      if (
        existing.rows.length > 0
      ) {

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
      // LÄGG TILL
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
// KONTROLLERA BEKRÄFTELSE
// =========================

app.get(
  "/api/events/:eventID/confirmation",

  async (req, res) => {

    try {

      const {
        eventID
      } = req.params;


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
// TA BORT HÄNDELSE
// =========================

app.delete(
  "/api/events/:eventID",
  async (req, res) => {
    const { eventID } = req.params;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Ta bort bekräftelser
      await client.query(
        `
        DELETE FROM EventConfirmations
        WHERE eventID = $1
        `,
        [eventID]
      );

      // Ta bort observationer
      await client.query(
        `
        DELETE FROM Observations
        WHERE eventID = $1
        `,
        [eventID]
      );

      // Ta bort själva händelsen
      const result = await client.query(
        `
        DELETE FROM Events
        WHERE eventID = $1
        RETURNING eventID
        `,
        [eventID]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Händelsen hittades inte."
        });
      }

      await client.query("COMMIT");

      res.json({
        message: "Händelsen har tagits bort.",
        eventID: Number(eventID)
      });

    } catch (error) {

      await client.query("ROLLBACK");

      console.error(
        "Fel vid borttagning av händelse:",
        error
      );

      res.status(500).json({
        message: "Kunde inte ta bort händelsen."
      });

    } finally {
      client.release();
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