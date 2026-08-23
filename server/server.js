const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("./cloudinary");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const pool = require("./db");

const app = express();


// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());


// =========================
// BILDUPPLADDNING
// =========================

// Bilder sparas tillfälligt i minnet
// och skickas sedan till Cloudinary.

const upload = multer({
  storage: multer.memoryStorage()
});


// =========================
// LADDA UPP BILD TILL CLOUDINARY
// =========================

function uploadToCloudinary(file, folder) {

  return new Promise((resolve, reject) => {

    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder: folder
        },

        (error, result) => {

          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        }
      );

    stream.end(file.buffer);
  });
}


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
  authenticateToken,
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
      // LADDA UPP BILD
      // =========================

      let imageUrl = null;


      if (req.file) {

        const uploadedImage =
          await uploadToCloudinary(
            req.file,
            "hendr/events"
          );


        imageUrl =
          uploadedImage.secure_url;

      }


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
      longitude,
      userid
    )

    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8)

    RETURNING
      eventID AS id,
      title,
      description,
      category,
      status,
      created_at AS "createdAt",
      image_url AS "imageUrl",
      latitude,
      longitude,
      userid
    `,
    [
      title,
      description,
      category,
      status,
      imageUrl,
      parsedLatitude,
      parsedLongitude,
      req.user.userid
    ]
  );


      res.status(201).json(
        result.rows[0]
      );


    } catch (error) {

      console.error(
        "Fel vid skapande av händelse:",
        error
      );


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


      // =========================
      // LADDA UPP BILD
      // =========================

      let imageUrl = null;


      if (req.file) {

        const uploadedImage =
          await uploadToCloudinary(
            req.file,
            "hendr/observations"
          );


        imageUrl =
          uploadedImage.secure_url;

      }


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


      // =========================
      // SPARA OBSERVATION
      // =========================

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

      console.error(
        "Fel vid skapande av observation:",
        error
      );


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

    const {
      eventID
    } = req.params;


    const client =
      await pool.connect();


    try {

      await client.query(
        "BEGIN"
      );


      // =========================
      // TA BORT BEKRÄFTELSER
      // =========================

      await client.query(
        `
        DELETE FROM EventConfirmations

        WHERE eventID = $1
        `,

        [eventID]
      );


      // =========================
      // TA BORT OBSERVATIONER
      // =========================

      await client.query(
        `
        DELETE FROM Observations

        WHERE eventID = $1
        `,

        [eventID]
      );


      // =========================
      // TA BORT HÄNDELSEN
      // =========================

      const result =
        await client.query(
          `
          DELETE FROM Events

          WHERE eventID = $1

          RETURNING eventID
          `,

          [eventID]
        );


      if (
        result.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );


        return res.status(404).json({
          message:
            "Händelsen hittades inte."
        });

      }


      await client.query(
        "COMMIT"
      );


      res.json({

        message:
          "Händelsen har tagits bort.",

        eventID:
          Number(eventID)

      });


    } catch (error) {

      await client.query(
        "ROLLBACK"
      );


      console.error(
        "Fel vid borttagning av händelse:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte ta bort händelsen."
      });


    } finally {

      client.release();

    }

  }
);


// =========================
// STARTA SERVERN
// =========================

// Render tilldelar porten via
// process.env.PORT.
// Lokalt används port 3000.

const PORT =
  process.env.PORT || 3000;


app.listen(
  PORT,
  "0.0.0.0",

  () => {

    console.log(
      `HENDR API körs på port ${PORT}`
    );

  }
);

// =========================
// REGISTRERA ANVÄNDARE
// =========================

app.post(
  "/api/auth/register",
  async (req, res) => {

    try {

      const {
        username,
        email,
        password
      } = req.body;


      // =========================
      // VALIDERING
      // =========================

      if (
        !username ||
        !email ||
        !password
      ) {

        return res.status(400).json({
          message:
            "Användarnamn, e-post och lösenord krävs."
        });

      }


      if (password.length < 6) {

        return res.status(400).json({
          message:
            "Lösenordet måste vara minst 6 tecken."
        });

      }


      // =========================
      // KONTROLLERA E-POST
      // =========================

      const existingUser =
        await pool.query(
          `
          SELECT userid
          FROM Users
          WHERE email = $1
          `,
          [email]
        );


      if (
        existingUser.rows.length > 0
      ) {

        return res.status(409).json({
          message:
            "Det finns redan en användare med denna e-post."
        });

      }


      // =========================
      // HASH LÖSENORD
      // =========================

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );


      // =========================
      // SKAPA ANVÄNDARE
      // =========================

      const result =
        await pool.query(
          `
          INSERT INTO Users
          (
            username,
            email,
            password_hash
          )

          VALUES
          ($1, $2, $3)

          RETURNING
            userid,
            username,
            email,
            created_at
          `,
          [
            username,
            email,
            passwordHash
          ]
        );


      // =========================
      // SVARA
      // =========================

      res.status(201).json({
        message:
          "Användaren har skapats.",

        user:
          result.rows[0]
      });


    } catch (error) {

      console.error(
        "Fel vid registrering:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte skapa användaren."
      });

    }

  }
);

// =========================
// LOGGA IN ANVÄNDARE
// =========================

// =========================
// LOGGA IN ANVÄNDARE
// =========================

app.post(
  "/api/auth/login",
  async (req, res) => {

    try {

      const {
        email,
        password
      } = req.body;


      // =========================
      // VALIDERING
      // =========================

      if (
        !email ||
        !password
      ) {

        return res.status(400).json({
          message:
            "E-post och lösenord krävs."
        });

      }


      // =========================
      // HÄMTA ANVÄNDARE
      // =========================

      const result =
        await pool.query(
          `
          SELECT
            userid,
            username,
            email,
            password_hash,
            created_at
          FROM Users
          WHERE email = $1
          `,
          [email]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(401).json({
          message:
            "Fel e-post eller lösenord."
        });

      }


      const user =
        result.rows[0];


      // =========================
      // KONTROLLERA LÖSENORD
      // =========================

      const passwordCorrect =
        await bcrypt.compare(
          password,
          user.password_hash
        );


      if (!passwordCorrect) {

        return res.status(401).json({
          message:
            "Fel e-post eller lösenord."
        });

      }


      // =========================
      // SKAPA JWT
      // =========================

      const token =
        jwt.sign(
          {
            userid:
              user.userid,

            username:
              user.username,

            email:
              user.email
          },

          process.env.JWT_SECRET,

          {
            expiresIn: "7d"
          }
        );


      // =========================
      // SVARA
      // =========================

      res.json({

        message:
          "Inloggningen lyckades.",

        token,

        user: {

          userid:
            user.userid,

          username:
            user.username,

          email:
            user.email,

          created_at:
            user.created_at

        }

      });


    } catch (error) {

      console.error(
        "Fel vid inloggning:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte logga in."
      });

    }

  }
);

// =========================
// AUTENTISERING
// =========================

function authenticateToken(
  req,
  res,
  next
) {

  const authHeader =
    req.headers.authorization;


  const token =
    authHeader &&
    authHeader.split(" ")[1];


  if (!token) {

    return res.status(401).json({
      message:
        "Du måste vara inloggad."
    });

  }


  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (error, user) => {

      if (error) {

        return res.status(403).json({
          message:
            "Ogiltig eller utgången token."
        });

      }


      req.user = user;

      next();

    }
  );

}

// =========================
// TESTA INLOGGAD ANVÄNDARE
// =========================

app.get(
  "/api/auth/me",
  authenticateToken,
  (req, res) => {

    res.json({
      user: req.user
    });

  }
);