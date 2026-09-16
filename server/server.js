const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("./cloudinary");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();
console.log(
  "JWT SECRET:",
  process.env.JWT_SECRET
);

const pool = require("./db");

const app = express();


// =========================
// MIDDLEWARE
// =========================

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
  address.suburb ||
  address.city_district ||
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

  console.log(
  "VERIFY JWT SECRET:",
  process.env.JWT_SECRET ? "FINNS" : "SAKNAS"
);


  jwt.verify(
    token,
    process.env.JWT_SECRET,

    (error, user) => {

      if (error) {
  console.log("JWT FEL:", error.message);

  return res.status(403).json({
    message: "Ogiltig eller utgången token."
  });
}


      req.user = user;
      console.log("Inloggad användare:", {
  userid: user.userid,
  username: user.username,
  role: user.role
});

      next();

    }
  );

}

// =========================
// SKAPA NOTIS
// =========================

async function createNotification({
  userID,
  type,
  eventID = null,
  actorUserID = null
}) {

  const result =
    await pool.query(
      `
        INSERT INTO Notifications
        (
          userID,
          type,
          eventID,
          actorUserID
        )

        VALUES
        (
          $1,
          $2,
          $3,
          $4
        )

        RETURNING
          notificationID AS id,
          userID,
          type,
          eventID,
          actorUserID,
          isRead,
          created_at AS "createdAt"
      `,

      [
        userID,
        type,
        eventID,
        actorUserID
      ]
    );


  return result.rows[0];

}

async function addXP(userID, type, referenceID, amount) {
  const result = await pool.query(
    `
      INSERT INTO "XPTransactions"
      (
        "userID",
        type,
        "referenceID",
        amount
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      ON CONFLICT ("userID", type, "referenceID")
      DO NOTHING
      RETURNING "xpTransactionID"
    `,
    [userID, type, referenceID, amount]
  );

  // Handlingen har redan gett XP
  if (result.rows.length === 0) {
    return null;
  }

  // Dela bara ut XP om transaktionen skapades
  const xpResult = await pool.query(
    `
      UPDATE Users
      SET
        xp = xp + $1,
        level = CASE
          WHEN xp + $1 >= 3000 THEN 7
          WHEN xp + $1 >= 1500 THEN 6
          WHEN xp + $1 >= 700 THEN 5
          WHEN xp + $1 >= 350 THEN 4
          WHEN xp + $1 >= 150 THEN 3
          WHEN xp + $1 >= 50 THEN 2
          ELSE 1
        END
      WHERE userid = $2
      RETURNING xp, level
    `,
    [amount, userID]
  );

  return xpResult.rows[0];
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

  e.updated_at AS "updatedAt",

  e.image_url AS "imageUrl",

  e.latitude,

  e.longitude,

  e.userid,

  e.location,

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


      res.json(result.rows);


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
// SÖK HÄNDELSER
// =========================

app.get(
  "/api/search",
  async (req, res) => {
    try {
      const query =
        req.query.q?.trim();

      if (!query) {
        return res.json([]);
      }

      const searchTerm = `%${query}%`;

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

            e.updated_at AS "updatedAt",

            e.image_url AS "imageUrl",

            e.latitude,

            e.longitude,

            e.userid,

            e.location,

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

          WHERE
            e.title ILIKE $1
            OR e.description ILIKE $1
            OR e.location ILIKE $1
            OR e.category ILIKE $1

          GROUP BY
            e.eventID,
            u.username

          ORDER BY
            e.created_at DESC
          `,
          [searchTerm]
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "Fel vid sökning:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte söka efter händelser."
      });
    }
  }
);


// =========================
// SKAPA NY ARTIKEL
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


      const locationName =
  req.body.location?.trim() || null;

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
      userid,
      location
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
      $8,
      $9
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

      userid,

      location
    `,

    [
      title,
      description,
      category,
      status,
      imageUrl,
      parsedLatitude,
      parsedLongitude,
      req.user.userid,
      locationName
    ]
  );

            const newEvent = result.rows[0];

            await addXP(
  req.user.userid,
  "article_created",
  newEvent.id,
  10
);

            res.status(201).json(newEvent);


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
// SKAPA UPPDATERING
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

        const eventResult =
  await pool.query(
    `
      SELECT
        userid
      FROM Events
      WHERE eventID = $1
    `,
    [eventID]
  );


if (eventResult.rows.length === 0) {

  return res.status(404).json({
    message:
      "Artikeln hittades inte."
  });

}


const articleOwnerID =
  eventResult.rows[0].userid;


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

if (articleOwnerID !== userID) {
  await addXP(
    userID,
    "update_created",
    result.rows[0].id,
    3
  );
}

if (articleOwnerID !== userID) {

  await createNotification({
    userID: articleOwnerID,
    type: "update",
    eventID: eventID,
    actorUserID: userID
  });

}


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
// SKAPA RAPPORT
// =========================

app.post(
  "/api/reports",
  authenticateToken,

  async (req, res) => {

    try {

      const {
        eventID,
        observationID,
        reason,
        description
      } = req.body;


      const userID =
        req.user.userid;


      if (!eventID && !observationID) {

        return res.status(400).json({
          message:
            "En artikel eller uppdatering måste anges."
        });

      }


      if (eventID && observationID) {

        return res.status(400).json({
          message:
            "En rapport kan bara gälla en artikel eller en uppdatering."
        });

      }


      if (!reason) {

        return res.status(400).json({
          message:
            "En anledning måste anges."
        });

      }


      const result =
        await pool.query(
          `
          INSERT INTO Reports
          (
            eventID,
            observationID,
            reportedBy,
            reason,
            description
          )

          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5
          )

          RETURNING

            reportID AS id,

            eventID,

            observationID,

            reportedBy,

            reason,

            description,

            status,

            created_at AS "createdAt"
          `,

          [
            eventID || null,
            observationID || null,
            userID,
            reason,
            description || null
          ]
        );


      res.status(201).json(
        result.rows[0]
      );


    } catch (error) {

      console.error(
        "Fel vid skapande av rapport:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte skapa rapporten."
      });

    }

  }
);

// =================================
// FÖLJ / SLUTA FÖLJA ARTIKEL
// =================================

app.post("/api/events/:eventID/follow", authenticateToken, async (req, res) => {
  const userID = req.user.userid;
  const eventID = Number(req.params.eventID);

  try {
    const eventResult = await pool.query(
      `
        SELECT eventID, userid
        FROM Events
        WHERE eventID = $1
      `,
      [eventID]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        message: "Artikeln hittades inte."
      });
    }

    const followResult = await pool.query(
      `
        SELECT "followID"
        FROM "Follows"
        WHERE "userID" = $1
        AND "eventID" = $2
      `,
      [userID, eventID]
    );

    if (followResult.rows.length > 0) {
      await pool.query(
        `
          DELETE FROM "Follows"
          WHERE "userID" = $1
          AND "eventID" = $2
        `,
        [userID, eventID]
      );

      return res.json({
        following: false
      });
    }

    await pool.query(
      `
        INSERT INTO "Follows"
        ("userID", "eventID")
        VALUES
        ($1, $2)
      `,
      [userID, eventID]
    );

    if (eventResult.rows[0].userid !== userID) {
  await addXP(
    userID,
    "follow_created",
    eventID,
    1
  );
}

    return res.json({
      following: true
    });

  } catch (error) {
    console.error("FEL VID FÖLJNING AV ARTIKEL:", error);

    return res.status(500).json({
      message: "Kunde inte ändra följstatus."
    });
  }
});

app.get("/api/events/:eventID/follow", authenticateToken, async (req, res) => {
  const userID = req.user.userid;
  const eventID = Number(req.params.eventID);

  try {
    const result = await pool.query(
      `
        SELECT "followID"
        FROM "Follows"
        WHERE "userID" = $1
        AND "eventID" = $2
      `,
      [userID, eventID]
    );

    return res.json({
      following: result.rows.length > 0
    });

  } catch (error) {
    console.error("FEL VID HÄMTNING AV FÖLJSTATUS:", error);

    return res.status(500).json({
      message: "Kunde inte hämta följstatus."
    });
  }
});


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
// TA BORT UPPDATERING
// ENDAST SKAPAREN
// =========================

app.delete(
  "/api/observations/:observationID",
  authenticateToken,
  async (req, res) => {
    try {
      const { observationID } = req.params;
      const userID = req.user.userid;

      const result = await pool.query(
        `
        DELETE FROM Observations

WHERE observationID = $1
AND (
  userID = $2
  OR $3 = 'Admin'
)
        RETURNING observationID
        `,
        [observationID, userID, req.user.role]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message:
            "Uppdateringen hittades inte eller så har du inte behörighet att ta bort den."
        });
      }

      res.json({
        message: "Uppdateringen har tagits bort.",
        observationID: Number(observationID)
      });
    } catch (error) {
      console.error(
        "Fel vid borttagning av uppdatering:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte ta bort uppdateringen."
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

        const eventResult =
  await pool.query(
    `
      SELECT
        userid
      FROM Events
      WHERE eventID = $1
    `,
    [eventID]
  );


if (eventResult.rows.length === 0) {

  return res.status(404).json({
    message:
      "Händelsen hittades inte."
  });

}


const eventOwnerID =
  eventResult.rows[0].userid;


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

        if (eventOwnerID !== userID) {
  await addXP(
    eventOwnerID,
    "confirmation_received",
    eventID,
    5
  );
}

              console.log(
  "SKAPAR BEKRÄFTELSENOTIS",
  {
    eventOwnerID,
    userID,
    eventID
  }
);

if (eventOwnerID !== userID) {

  try {

    console.log(
      "FÖRSÖKER SKAPA BEKRÄFTELSENOTIS"
    );

    const notification =
      await createNotification({
        userID: eventOwnerID,
        type: "confirmation",
        eventID: Number(eventID),
        actorUserID: userID
      });

    console.log(
      "BEKRÄFTELSENOTIS SKAPAD",
      notification
    );

  } catch (error) {

    console.error(
      "FEL VID SKAPANDE AV BEKRÄFTELSENOTIS:",
      error
    );

  }

}


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
  event.userid !== userID &&
  req.user.role !== "Admin"
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
// ADMIN – STATISTIK
// =========================
console.log("ADMIN STATS ROUTE REGISTRERAS");
app.get(
  "/api/admin/stats",
  (req, res, next) => {
    console.log("ADMIN ROUTE TRÄFFAD");
    next();
  },
  authenticateToken,
  async (req, res) => {

    console.log("ADMIN STATS REQUEST:", {
      userid: req.user.userid,
      username: req.user.username,
      role: req.user.role
    });

    try {
      if (req.user.role !== "Admin") {
  console.log("ADMIN NEKAD:", req.user);

  return res.status(403).json({
    message: "Du har inte behörighet.",
    debug: req.user
  });
}

      const result = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM Users) AS "userCount",
          (SELECT COUNT(*) FROM Events) AS "eventCount",
          (SELECT COUNT(*) FROM Observations) AS "observationCount",
          (SELECT COUNT(*) FROM EventConfirmations) AS "confirmationCount",
          (SELECT COUNT(*) FROM "Follows") AS "followCount"
      `);

      res.json(result.rows[0]);
    } catch (error) {
      console.error(
        "Fel vid hämtning av admin-statistik:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte hämta statistik."
      });
    }
  }
);

// =========================
// ADMIN – ANVÄNDARE
// =========================
app.get(
  "/api/admin/users",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message: "Du har inte behörighet."
        });
      }

      const result = await pool.query(`
        SELECT
          userid,
          username,
          role,
          xp,
          level,
          created_at AS "createdAt"
        FROM Users
        ORDER BY created_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      console.error(
        "Fel vid hämtning av admin-användare:",
        error
      );

      res.status(500).json({
        message: "Kunde inte hämta användare."
      });
    }
  }
);

// =========================
// HÄMTA RAPPORTER FÖR ADMIN
// =========================

app.get(
  "/api/admin/reports",
  authenticateToken,

  async (req, res) => {

    try {

      if (req.user.role !== "Admin") {

        return res.status(403).json({
          message:
            "Du saknar behörighet."
        });

      }


      const result =
        await pool.query(
          `
          SELECT

            r.reportID AS id,

            r.eventID,

            r.observationID,

            r.reportedBy,

            reporter.username AS "reportedByUsername",

            r.reason,

            r.description,

            r.status,

            r.reviewedBy,

            reviewer.username AS "reviewedByUsername",

            r.reviewed_at AS "reviewedAt",

            r.created_at AS "createdAt",

            e.title AS "articleTitle",

            o.description AS "updateDescription"

          FROM Reports r

          LEFT JOIN Users reporter
            ON reporter.userid = r.reportedBy

          LEFT JOIN Users reviewer
            ON reviewer.userid = r.reviewedBy

          LEFT JOIN Events e
            ON e.eventID = r.eventID

          LEFT JOIN Observations o
            ON o.observationID = r.observationID

          ORDER BY
            r.created_at DESC
          `
        );


      res.json(
        result.rows
      );


    } catch (error) {

      console.error(
        "Fel vid hämtning av rapporter:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hämta rapporterna."
      });

    }

  }
);

// =========================
// HANTERA RAPPORT FÖR ADMIN
// =========================

app.patch(
  "/api/admin/reports/:id",
  authenticateToken,

  async (req, res) => {

    try {

      if (req.user.role !== "Admin") {

        return res.status(403).json({
          message:
            "Du saknar behörighet."
        });

      }


      const reportID =
        Number(req.params.id);

      const {
        status
      } = req.body;


      if (
        !["approved", "removed"].includes(status)
      ) {

        return res.status(400).json({
          message:
            "Ogiltig rapportstatus."
        });

      }


      const reportResult =
        await pool.query(
          `
          SELECT
            reportID,
            eventID,
            observationID
          FROM Reports
          WHERE reportID = $1
          `,
          [reportID]
        );


      if (
        reportResult.rows.length === 0
      ) {

        return res.status(404).json({
          message:
            "Rapporten hittades inte."
        });

      }


      const report =
        reportResult.rows[0];


      if (status === "removed") {

        if (report.eventid) {

          await pool.query(
            `
            UPDATE Events
            SET status = 'Removed'
            WHERE eventID = $1
            `,
            [report.eventid]
          );

        }


        if (report.observationid) {

          await pool.query(
            `
            UPDATE Observations
            SET moderation_status = 'blocked'
            WHERE observationID = $1
            `,
            [report.observationid]
          );

        }

      }


      const result =
        await pool.query(
          `
          UPDATE Reports

          SET
            status = $1,
            reviewedBy = $2,
            reviewed_at = CURRENT_TIMESTAMP

          WHERE reportID = $3

          RETURNING

            reportID AS id,
            eventID,
            observationID,
            reportedBy,
            reason,
            description,
            status,
            reviewedBy,
            reviewed_at AS "reviewedAt",
            created_at AS "createdAt"
          `,

          [
            status,
            req.user.userid,
            reportID
          ]
        );


      res.json(
        result.rows[0]
      );


    } catch (error) {

      console.error(
        "Fel vid hantering av rapport:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hantera rapporten."
      });

    }

  }
);

// =========================
// REDIGERA HÄNDELSE
// ÄGAREN ELLER ADMIN
// =========================

app.put(
  "/api/events/:eventID",
  authenticateToken,
  upload.single("image"),

  async (req, res) => {
    const { eventID } = req.params;
    const userID = req.user.userid;

    try {
      // =========================
      // HÄMTA HÄNDELSEN
      // =========================

      const eventResult = await pool.query(
        `
        SELECT
          eventID,
          userid,
          image_url
        FROM Events
        WHERE eventID = $1
        `,
        [eventID]
      );

      if (eventResult.rows.length === 0) {
        return res.status(404).json({
          message: "Händelsen hittades inte."
        });
      }

      const existingEvent = eventResult.rows[0];

      // =========================
      // BEHÖRIGHET
      // ÄGAREN ELLER ADMIN
      // =========================

      if (
        existingEvent.userid !== userID &&
        req.user.role !== "Admin"
      ) {
        return res.status(403).json({
          message:
            "Du har inte behörighet att redigera denna händelse."
        });
      }

      // =========================
      // HÄMTA DATA
      // =========================

      const {
        title,
        description,
        category,
        status,
        latitude,
        longitude,
        location
      } = req.body;

      // =========================
      // VALIDERING
      // =========================

      if (!title?.trim()) {
        return res.status(400).json({
          message: "Skriv en rubrik för händelsen."
        });
      }

      if (!description?.trim()) {
        return res.status(400).json({
          message: "Beskriv kort vad som händer."
        });
      }

      if (!location?.trim()) {
        return res.status(400).json({
          message: "Du måste ange en plats."
        });
      }

      // =========================
      // BILD
      // =========================

      let imageUrl = existingEvent.image_url;

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
      // KOORDINATER
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
      // UPPDATERA HÄNDELSEN
      // =========================

      const result = await pool.query(
        `
        UPDATE Events
        SET
        title = $1,
        description = $2,
        category = $3,
        status = $4,
        image_url = $5,
        latitude = $6,
        longitude = $7,
        location = $8,
        updated_at = CURRENT_TIMESTAMP
        WHERE eventID = $9
        RETURNING
          eventID AS id,
          title,
          description,
          category,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt",
          image_url AS "imageUrl",
          latitude,
          longitude,
          userid,
          location
        `,
        [
          title.trim(),
          description.trim(),
          category,
          status || "Aktiv",
          imageUrl,
          parsedLatitude,
          parsedLongitude,
          location.trim(),
          eventID
        ]
      );

      // =========================
      // SVARA
      // =========================

      res.json(result.rows[0]);

    } catch (error) {

      console.error(
        "Fel vid redigering av händelse:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte redigera händelsen."
      });
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

            updated_at AS "updatedAt",

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
// HÄMTA ARTIKLAR JAG FÖLJER
// =========================

app.get(
  "/api/users/me/follows",
  authenticateToken,

  async (req, res) => {
    try {
      const userID =
        req.user.userid;

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
            e.placeID,
            e.image_url AS "imageUrl",
            e.latitude,
            e.longitude,
            e.userid,
            e.location,
            u.username
          FROM "Follows" f

          INNER JOIN Events e
            ON e.eventID = f."eventID"

          LEFT JOIN Users u
            ON u.userid = e.userid

          WHERE f."userID" = $1

          ORDER BY
            f.created_at DESC
          `,
          [userID]
        );

      res.json(
        result.rows
      );

    } catch (error) {
      console.error(
        "Fel vid hämtning av följda artiklar:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte hämta följda artiklar."
      });
    }
  }
);

// =========================
// REDIGERA MIN PROFIL
// =========================

app.put(
  "/api/users/me/profile",
  authenticateToken,

  async (req, res) => {

    try {

      const userID = req.user.userid;

      const {
        bio,
        location
      } = req.body;

      const cleanBio =
        bio?.trim() || null;

      const cleanLocation =
        location?.trim() || null;

      const result =
        await pool.query(
          `
          UPDATE Users
          SET
            bio = $1,
            location = $2
          WHERE userid = $3

          RETURNING
            userid,
            username,
            email,
            role,
            bio,
            location,
            created_at AS "createdAt"
          `,
          [
            cleanBio,
            cleanLocation,
            userID
          ]
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
        "Fel vid redigering av profil:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte spara profilen."
      });

    }

  }
);

// =========================
// LÄGG TILL / BYT PROFILBILD
// =========================

app.put(
  "/api/users/me/profile-image",
  authenticateToken,
  upload.single("image"),

  async (req, res) => {
    try {
      const userID = req.user.userid;

      if (!req.file) {
        return res.status(400).json({
          message: "Ingen bild valdes."
        });
      }

      const uploadedImage =
        await uploadToCloudinary(
          req.file,
          "hendr/profiles"
        );

      const profileImageUrl =
        uploadedImage.secure_url;

      const result =
        await pool.query(
          `
          UPDATE Users
          SET profile_image_url = $1
          WHERE userid = $2

          RETURNING
            userid,
            username,
            profile_image_url AS "profileImageUrl"
          `,
          [
            profileImageUrl,
            userID
          ]
        );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Användaren kunde inte hittas."
        });
      }

      res.json(result.rows[0]);

    } catch (error) {

      console.error(
        "Fel vid uppladdning av profilbild:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte ladda upp profilbilden."
      });
    }
  }
);

// =========================
// HÄMTA MIN STATISTIK
// =========================

app.get(
  "/api/users/me/stats",
  authenticateToken,

  async (req, res) => {

    try {

      const userID =
        req.user.userid;

      const result =
        await pool.query(
          `
          SELECT

            xp,
            level,

            (
              SELECT COUNT(*)
              FROM Events
              WHERE userid = $1
            ) AS "articleCount",

            (
              SELECT COUNT(*)
              FROM EventConfirmations ec
              INNER JOIN Events e
                ON e.eventID = ec.eventID
              WHERE e.userid = $1
            ) AS "confirmationCount",

            (
              SELECT COUNT(*)
              FROM Observations
              WHERE userID = $1
            ) AS "updateCount"

          FROM Users
          WHERE userid = $1
          `,
          [userID]
        );

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(
        "Fel vid hämtning av användarstatistik:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte hämta användarstatistik."
      });

    }

  }
);

// =========================
// HÄMTA PUBLIK ANVÄNDARSTATISTIK
// =========================

app.get(
  "/api/users/:userid/stats",
  async (req, res) => {

    try {

      const { userid } = req.params;

      const result =
        await pool.query(
          `
          SELECT

            (
              SELECT COUNT(*)
              FROM Events
              WHERE userid = $1
            ) AS "articleCount",

            (
              SELECT COUNT(*)
              FROM EventConfirmations ec
              INNER JOIN Events e
                ON e.eventID = ec.eventID
              WHERE e.userid = $1
            ) AS "confirmationCount",

            (
              SELECT COUNT(*)
              FROM Observations
              WHERE userID = $1
            ) AS "updateCount"

          `,
          [userid]
        );

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(
        "Fel vid hämtning av publik användarstatistik:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte hämta användarstatistiken."
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
// HÄMTA MINA NOTISER
// =========================

app.get(
  "/api/notifications",
  authenticateToken,

  async (req, res) => {

    try {

      const userID =
        req.user.userid;


      const result =
        await pool.query(
          `
            SELECT

  n.notificationID AS id,

  n.userID,

  n.type,

  n.eventID,

  n.actorUserID,

  u.username AS "actorUsername",

  n.isread AS "isRead",

  n.created_at AS "createdAt"

FROM Notifications n

LEFT JOIN Users u
  ON u.userid = n.actorUserID

WHERE n.userID = $1

ORDER BY
  n.created_at DESC
          `,

          [userID]
        );


      res.json(
        result.rows
      );


    } catch (error) {

      console.error(
        "Fel vid hämtning av notiser:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hämta notiser."
      });

    }

  }
);

// =========================
// MARKERA NOTIS SOM LÄST
// =========================

app.patch(
  "/api/notifications/:notificationID/read",
  authenticateToken,

  async (req, res) => {

    try {

      const {
        notificationID
      } = req.params;

      const userID =
        req.user.userid;

      const result =
        await pool.query(
          `
            UPDATE Notifications

            SET isRead = TRUE

            WHERE notificationID = $1
            AND userID = $2

            RETURNING
              notificationID AS id,
              isRead
          `,
          [
            notificationID,
            userID
          ]
        );

      if (result.rows.length === 0) {

        return res.status(404).json({
          message:
            "Notisen hittades inte."
        });

      }

      res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(
        "Fel vid markering av notis:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte markera notisen som läst."
      });

    }

  }
);

// RENSA NOTISER
app.delete(
  "/api/notifications/read",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          DELETE FROM Notifications
          WHERE userID = $1
          AND isRead = TRUE
          RETURNING notificationID
        `,
        [req.user.userid]
      );

      res.json({
        message: "Lästa notiser raderade.",
        deletedCount: result.rowCount
      });

    } catch (error) {
      console.error(
        "Fel vid radering av lästa notiser:",
        error
      );

      res.status(500).json({
        message: "Kunde inte radera lästa notiser."
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

      const { userid } = req.params;

      const result =
        await pool.query(
          `
          SELECT
            userid,
            username,
            bio,
            location,
            profile_image_url AS "profileImageUrl",
            created_at AS "createdAt"
            FROM Users
            WHERE userid = $1
          `,
          [userid]
        );

      if (result.rows.length === 0) {

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

      const { userid } = req.params;

      const result = await pool.query(
        `
        SELECT
          e.eventID AS id,
          e.title,
          e.description,
          e.category,
          e.status,
          e.created_at AS "createdAt",
          updated_at AS "updatedAt",
          e.image_url AS "imageUrl",
          e.latitude,
          e.longitude,
          e.userid,
          e.location,
          u.username AS username,

          (
            SELECT COUNT(*)
            FROM Observations o
            WHERE o.eventID = e.eventID
          ) AS "observationCount",

          (
            SELECT COUNT(*)
            FROM EventConfirmations ec
            WHERE ec.eventID = e.eventID
          ) AS "confirmationCount"

        FROM Events e

        LEFT JOIN Users u
          ON u.userid = e.userid

        WHERE e.userid = $1

        ORDER BY e.created_at DESC
        `,
        [userid]
      );

      res.json(result.rows);

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
        user.email,

      role:
        user.role
    },

    process.env.JWT_SECRET,

    {
      expiresIn:
        "7d"
    }
  );

  console.log(
  "JWT skapad för:",
  user.userid,
  user.username,
  user.role
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

            role,

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

        console.log("Användare från databasen:", {
  userid: user.userid,
  username: user.username,
  role: user.role
});


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

console.log(
  "LOGIN JWT SECRET:",
  process.env.JWT_SECRET ? "FINNS" : "SAKNAS"
);
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
              user.email,

            role:
              user.role
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

          role:
            user.role,

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
// HÄMTA AKTUELL ANVÄNDARPROFIL
// =========================

app.get(
  "/api/auth/me",
  authenticateToken,

  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            userid,
            username,
            email,
            role,
            bio,
            location,
            profile_image_url AS "profileImageUrl",
            created_at AS "createdAt"
          FROM Users
          WHERE userid = $1
          `,
          [req.user.userid]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          message:
            "Användaren kunde inte hittas."
        });

      }

      res.json({
        user:
          result.rows[0]
      });

    } catch (error) {

      console.error(
        "Fel vid hämtning av aktuell användare:",
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