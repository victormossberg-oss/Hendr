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

    const response =
      await axios.get(
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
// HÄMTA ALLA HÄNDELSER
// =========================

app.get(
  "/api/events",

  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
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

  e.userid,

  u.username AS username,

            COUNT(
              DISTINCT o.observationID
            ) AS "observationCount",

            COUNT(
              DISTINCT ec.confirmationID
            ) AS "confirmationCount"

          FROM Events e

LEFT JOIN Users u
  ON u.userid = e.userid

LEFT JOIN Observations o
  ON o.eventID = e.eventID

LEFT JOIN EventConfirmations ec
  ON ec.eventID = e.eventID

          GROUP BY
  e.eventID,
  u.username

          ORDER BY
            e.created_at DESC
          `
        );


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
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
          )

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
  authenticateToken,
  upload.single("image"),

  async (req, res) => {

    try {

      const {
        eventID,
        description,
        latitude,
        longitude
      } = req.body;


      const userID =
        req.user.userid;


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
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )

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

      o.observationID AS id,

      o.userID,

      o.eventID,

      o.description,

      o.image_url AS "imageUrl",

      o.created_at AS "createdAt",

      o.latitude,

      o.longitude,

      u.username AS username

    FROM Observations o

    LEFT JOIN Users u
      ON u.userid = o.userID

    WHERE o.eventID = $1

    ORDER BY
      o.created_at DESC
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
  authenticateToken,

  async (req, res) => {

    try {

      const {
        eventID
      } = req.params;


      const userID =
        req.user.userid;


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


      const result =
        await pool.query(
          `
          INSERT INTO EventConfirmations
          (
            eventID,
            userID
          )

          VALUES
          (
            $1,
            $2
          )

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

      console.error(
        "Fel vid ändring av bekräftelse:",
        error
      );


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
  authenticateToken,

  async (req, res) => {

    try {

      const {
        eventID
      } = req.params;


      const userID =
        req.user.userid;


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

      console.error(
        "Fel vid kontroll av bekräftelse:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte kontrollera bekräftelsen."
      });

    }

  }
);


// =========================
// TA BORT HÄNDELSE
// ENDAST SKAPAREN
// =========================

app.delete(
  "/api/events/:eventID",
  authenticateToken,

  async (req, res) => {

    const {
      eventID
    } = req.params;


    const userID =
      req.user.userid;


    const client =
      await pool.connect();


    try {

      const eventResult =
        await client.query(
          `
          SELECT

            eventID,

            userid

          FROM Events

          WHERE eventID = $1
          `,

          [eventID]
        );


      if (
        eventResult.rows.length === 0
      ) {

        return res.status(404).json({
          message:
            "Händelsen hittades inte."
        });

      }


      const event =
        eventResult.rows[0];


      if (
        event.userid !== userID
      ) {

        return res.status(403).json({
          message:
            "Du har inte behörighet att ta bort denna händelse."
        });

      }


      await client.query(
        "BEGIN"
      );


      await client.query(
        `
        DELETE FROM EventConfirmations

        WHERE eventID = $1
        `,

        [eventID]
      );


      await client.query(
        `
        DELETE FROM Observations

        WHERE eventID = $1
        `,

        [eventID]
      );


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
// HÄMTA MINA HÄNDELSER
// =========================

app.get(
  "/api/users/me/events",
  authenticateToken,

  async (req, res) => {

    try {

      const userID =
        req.user.userid;


      const result =
        await pool.query(
          `
          SELECT

            eventID AS id,

            title,

            description,

            category,

            status,

            created_at AS "createdAt",

            placeID,

            image_url AS "imageUrl",

            latitude,

            longitude,

            userid

          FROM Events

          WHERE userid = $1

          ORDER BY
            created_at DESC
          `,

          [userID]
        );


      res.json(
        result.rows
      );


    } catch (error) {

      console.error(
        "Fel vid hämtning av mina händelser:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hämta dina händelser."
      });

    }

  }
);


// =========================
// HÄMTA MINA OBSERVATIONER
// =========================

app.get(
  "/api/users/me/observations",
  authenticateToken,

  async (req, res) => {

    try {

      const userID =
        req.user.userid;


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

          WHERE userID = $1

          ORDER BY
            created_at DESC
          `,

          [userID]
        );


      res.json(
        result.rows
      );


    } catch (error) {

      console.error(
        "Fel vid hämtning av mina observationer:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hämta dina observationer."
      });

    }

  }
);

// =========================
// HÄMTA PUBLIK ANVÄNDARPROFIL
// =========================

app.get(
  "/api/users/:userid",
  async (req, res) => {

    try {

      const {
        userid
      } = req.params;


      const result =
        await pool.query(
          `
          SELECT
            userid,
            username,
            created_at AS "createdAt"
          FROM Users
          WHERE userid = $1
          `,
          [userid]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          message:
            "Användaren kunde inte hittas."
        });

      }


      res.json(
        result.rows[0]
      );


    } catch (error) {

      console.error(
        "Fel vid hämtning av publik användarprofil:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hämta användarprofilen."
      });

    }

  }
);

// =========================
// HÄMTA EN ANVÄNDARES
// PUBLIKA HÄNDELSER
// =========================

app.get(
  "/api/users/:userid/events",
  async (req, res) => {

    try {

      const {
        userid
      } = req.params;


      const result =
        await pool.query(
          `
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

            e.userid,

            u.username AS username

          FROM Events e

          LEFT JOIN Users u
            ON u.userid = e.userid

          WHERE e.userid = $1

          ORDER BY
            e.created_at DESC
          `,
          [userid]
        );


      res.json(
        result.rows
      );


    } catch (error) {

      console.error(
        "Fel vid hämtning av användarens händelser:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hämta användarens händelser."
      });

    }

  }
);

// =========================
// HÄMTA EN ANVÄNDARES
// PUBLIKA OBSERVATIONER
// =========================

app.get(
  "/api/users/:userid/observations",
  async (req, res) => {

    try {

      const {
        userid
      } = req.params;


      const result =
        await pool.query(
          `
          SELECT

            o.observationID AS id,

            o.userID,

            o.eventID,

            o.description,

            o.image_url AS "imageUrl",

            o.created_at AS "createdAt",

            o.latitude,

            o.longitude,

            u.username AS username

          FROM Observations o

          LEFT JOIN Users u
            ON u.userid = o.userID

          WHERE o.userID = $1

          ORDER BY
            o.created_at DESC
          `,
          [userid]
        );


      res.json(
        result.rows
      );


    } catch (error) {

      console.error(
        "Fel vid hämtning av användarens observationer:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hämta användarens observationer."
      });

    }

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


      // =========================
      // TRIMMA OCH NORMALISERA
      // =========================

      const cleanUsername =
        username.trim();

      const cleanEmail =
        email.trim().toLowerCase();


      // =========================
      // KONTROLLERA ANVÄNDARNAMN
      // =========================

      if (
        cleanUsername.length < 3
      ) {

        return res.status(400).json({
          message:
            "Användarnamnet måste vara minst 3 tecken."
        });

      }


      if (
        cleanUsername.length > 25
      ) {

        return res.status(400).json({
          message:
            "Användarnamnet får vara högst 25 tecken."
        });

      }


      // =========================
      // KONTROLLERA LÖSENORD
      // =========================

      if (
        password.length < 8
      ) {

        return res.status(400).json({
          message:
            "Lösenordet måste vara minst 8 tecken."
        });

      }


      // =========================
      // KONTROLLERA E-POST
      // =========================

      const existingUser =
        await pool.query(
          `
          SELECT
            userid

          FROM Users

          WHERE email = $1
          `,

          [cleanEmail]
        );


      if (
        existingUser.rows.length > 0
      ) {

        return res.status(409).json({
          message:
            "Det finns redan ett konto med den e-postadressen."
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
          (
            $1,
            $2,
            $3
          )

          RETURNING

            userid,

            username,

            email,

            created_at
          `,

          [
            cleanUsername,
            cleanEmail,
            passwordHash
          ]
        );


      const user =
        result.rows[0];


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
            expiresIn:
              "7d"
          }
        );


      // =========================
      // SVARA
      // =========================

      res.status(201).json({

        message:
          "Kontot skapades.",

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
        "Fel vid registrering:",
        error
      );


      // PostgreSQL unique constraint

      if (
        error.code === "23505"
      ) {

        return res.status(409).json({
          message:
            "Det finns redan ett konto med den e-postadressen."
        });

      }


      res.status(500).json({
        message:
          "Kunde inte skapa kontot."
      });

    }

  }
);


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


      const cleanEmail =
        email.trim().toLowerCase();


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

          [cleanEmail]
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


      if (
        !passwordCorrect
      ) {

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
            expiresIn:
              "7d"
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
// TESTA INLOGGAD ANVÄNDARE
// =========================

app.get(
  "/api/auth/me",
  authenticateToken,

  (req, res) => {

    res.json({
      user:
        req.user
    });

  }
);


// =========================
// STARTA SERVERN
// =========================

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