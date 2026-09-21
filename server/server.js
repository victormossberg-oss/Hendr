const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("./cloudinary");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai");
const { Resend } = require("resend");

require("dotenv").config();


const pool = require("./db");

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 0
});

const resend = new Resend(process.env.RESEND_API_KEY);

// =========================
// SKICKA VERIFIERINGSMAIL
// =========================

async function sendVerificationEmail(email, username, token) {
  const verificationUrl = `https://www.hendr.se/verify-email?token=${token}`;

  await resend.emails.send({
    from: "HENDR <noreply@hendr.se>",
    to: email,
    subject: "Verifiera din e-postadress på HENDR",
    html: `
      <h2>Välkommen till HENDR, ${username}!</h2>

      <p>
        Klicka på knappen nedan för att verifiera din e-postadress.
      </p>

      <p>
        <a
          href="${verificationUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Verifiera e-postadress
        </a>
      </p>

      <p>
        Länken är giltig i 24 timmar.
      </p>

      <p>
        Om du inte skapade ett konto på HENDR kan du ignorera detta mejl.
      </p>
    `
  });
}


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
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(
        new Error("Endast bildfiler är tillåtna.")
      );
    }

    cb(null, true);
  }
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
// MODERERING
// =========================

async function moderateContent({
  title = "",
  description = "",
  imageUrl = null
}) {
  const input = [
    {
      type: "text",
      text: `Titel: ${title}\n\nText: ${description}`
    }
  ];

  if (imageUrl) {
    input.push({
      type: "image_url",
      image_url: {
        url: imageUrl
      }
    });
  }

  let response;

try {
  response = await openai.moderations.create({
    model: "omni-moderation-latest",
    input
  });
} catch (error) {
  console.error(
  "OPENAI MODERATION ERROR:",
  error.status,
  error.message
);

  throw error;
}

  const result = response.results[0];

  return {
    status: result.flagged ? "review" : "safe",
    categories: Object.keys(result.categories).filter(
      (category) => result.categories[category]
    ),
    confidence: Math.max(
      ...Object.values(result.category_scores)
    )
  };
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

async function unlockAchievement(userID, icon) {
  const achievementResult = await pool.query(
    `
      SELECT
        achievementid,
        name,
        description,
        icon,
        category,
        xpreward
      FROM achievements
      WHERE icon = $1
    `,
    [icon]
  );

  // Badgen finns inte
  if (achievementResult.rows.length === 0) {
    return null;
  }

  const achievement = achievementResult.rows[0];

  // Försök låsa upp badgen
  const result = await pool.query(
    `
      INSERT INTO userachievements
      (
        userid,
        achievementid
      )
      VALUES
      (
        $1,
        $2
      )
      ON CONFLICT (userid, achievementid)
      DO NOTHING
      RETURNING userachievementid, unlockedat
    `,
    [userID, achievement.achievementid]
  );

  // Användaren hade redan badgen
  if (result.rows.length === 0) {
    return null;
  }

  // Ge XP för badgen
  if (achievement.xpreward > 0) {
    await addXP(
      userID,
      "achievement_unlocked",
      achievement.achievementid,
      achievement.xpreward
    );
  }

  return {
    achievementID: achievement.achievementid,
    name: achievement.name,
    description: achievement.description,
    icon: achievement.icon,
    category: achievement.category,
    xpReward: achievement.xpreward,
    unlockedAt: result.rows[0].unlockedat
  };
}

async function checkActivityAchievements(userID) {
  const result = await pool.query(
    `
      SELECT COUNT(DISTINCT DATE_TRUNC('week', created_at)) AS active_weeks
      FROM "XPTransactions"
      WHERE "userID" = $1
        AND type IN (
          'article_created',
          'update_created',
          'follow_created'
        )
    `,
    [userID]
  );

  const activeWeeks = Number(result.rows[0].active_weeks);

  if (activeWeeks >= 3) {
    await unlockAchievement(userID, "on_the_move");
  }

  if (activeWeeks >= 8) {
    await unlockAchievement(userID, "regular");
  }
}

// =========================
// HÄMTA ALLA ARTIKLAR
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
  AND o.moderation_status != 'blocked'

LEFT JOIN EventConfirmations ec
  ON ec.eventID = e.eventID

WHERE e.status != 'Removed'
AND e.moderation_status = 'safe'

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
// SÖK Artikel
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
            AND o.moderation_status != 'blocked'

          LEFT JOIN EventConfirmations ec
            ON ec.eventID = e.eventID

          WHERE
  e.status != 'Removed'
  AND e.moderation_status = 'safe'
  AND (
    e.title ILIKE $1
    OR e.description ILIKE $1
    OR e.location ILIKE $1
    OR e.category ILIKE $1
  )

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
  location,
  moderation_status
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
  $9,
  'pending'
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

try {
  const moderationResult = await moderateContent({
    title: newEvent.title,
    description: newEvent.description,
    imageUrl: newEvent.imageUrl
  });

  await pool.query(
    `
    UPDATE Events
    SET
      moderation_status = $1,
      moderation_categories = $2,
      moderation_confidence = $3,
      moderated_at = CURRENT_TIMESTAMP
    WHERE eventID = $4
    `,
    [
      moderationResult.status,
      moderationResult.categories,
      moderationResult.confidence,
      newEvent.id
    ]
  );

  newEvent.moderation_status = moderationResult.status;

} catch (moderationError) {
  console.error(
    "Automatisk moderering misslyckades. Artikeln ligger kvar som pending.",
    moderationError
  );

  newEvent.moderation_status = "pending";
}



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
AND status != 'Removed'
AND moderation_status = 'safe'
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
  longitude,
  moderation_status
)

   VALUES
(
  $1,
  $2,
  $3,
  $4,
  $5,
  $6,
  'safe'
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
  await checkActivityAchievements(userID);
}

const updateCount = await pool.query(
  `
  SELECT COUNT(*) AS count
  FROM Observations
  WHERE userID = $1
    AND moderation_status = 'safe'
  `,
  [userID]
);

if (Number(updateCount.rows[0].count) >= 5) {
  await unlockAchievement(
    userID,
    "contributor"
  );
}

if (Number(updateCount.rows[0].count) >= 25) {
  await unlockAchievement(
    userID,
    "community_builder"
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
        "Fel vid skapande av uppdatering:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte skapa uppdatering."
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

      if (eventID) {

  const eventResult =
    await pool.query(
      `
      SELECT eventID
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
if (observationID) {

  const observationResult =
    await pool.query(
      `
      SELECT observationID
      FROM Observations
      WHERE observationID = $1
      `,
      [observationID]
    );

  if (observationResult.rows.length === 0) {
    return res.status(404).json({
      message:
        "Uppdateringen hittades inte."
    });
  }

}
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
AND status != 'Removed'
AND moderation_status = 'safe'
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

  await checkActivityAchievements(userID);
}

const followedArticleCount = await pool.query(
  `
  SELECT COUNT(*) AS count
  FROM "Follows"
  WHERE "userID" = $1
  `,
  [userID]
);

if (Number(followedArticleCount.rows[0].count) >= 10) {
  await unlockAchievement(
    userID,
    "engaged"
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
        SELECT f."followID"
FROM "Follows" f
INNER JOIN Events e
  ON e.eventID = f."eventID"
WHERE f."userID" = $1
AND f."eventID" = $2
AND e.status != 'Removed'
AND e.moderation_status = 'safe'
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
// HÄMTA UPPDATERINGAR
// FÖR EN ARTIKEL
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
AND o.moderation_status = 'safe'

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
      SELECT eventID, userid
      FROM Events
      WHERE eventID = $1
      AND status != 'Removed'
      AND moderation_status = 'safe'
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

const verificationCount = await pool.query(
  `
  SELECT COUNT(*) AS count
  FROM EventConfirmations
  WHERE userID = $1
  `,
  [userID]
);

if (Number(verificationCount.rows[0].count) >= 25) {
  await unlockAchievement(
    userID,
    "verifier"
  );
}

const confirmationCount = await pool.query(
  `
  SELECT COUNT(*) AS count
  FROM EventConfirmations
  WHERE eventID = $1
  `,
  [eventID]
);

if (Number(confirmationCount.rows[0].count) >= 10) {
  await unlockAchievement(
    eventOwnerID,
    "trusted_source"
  );
}

if (Number(confirmationCount.rows[0].count) >= 25) {
  await unlockAchievement(
    eventOwnerID,
    "well_confirmed"
  );
}

if (Number(confirmationCount.rows[0].count) >= 50) {
  await unlockAchievement(
    eventOwnerID,
    "top_article"
  );
}

if (Number(confirmationCount.rows[0].count) >= 100) {
  await unlockAchievement(
    eventOwnerID,
    "local_talk"
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
  ec.confirmationID
FROM EventConfirmations ec
JOIN Events e
  ON e.eventID = ec.eventID
WHERE ec.eventID = $1
AND ec.userID = $2
AND e.status != 'Removed'
AND e.moderation_status = 'safe'
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
  userid,
  status
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

if (event.status === "Removed" && req.user.role !== "Admin") {
  return res.status(403).json({
    message: "Den här artikeln är borttagen."
  });
}
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
          (SELECT COUNT(*) FROM Events WHERE moderation_status = 'safe') AS "eventCount",
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

app.get(
  "/api/admin/pending-articles",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message: "Åtkomst nekad."
        });
      }

      const result = await pool.query(
        `
        SELECT
          e.eventID AS id,
          e.title,
          e.description,
          e.category,
          e.created_at AS "createdAt",
          e.image_url AS "imageUrl",
          e.userid,
          u.username AS username,
          e.moderation_status AS "moderationStatus"
        FROM Events e
        LEFT JOIN Users u
          ON u.userid = e.userid
        WHERE e.moderation_status = 'pending'
          AND e.status != 'Removed'
        ORDER BY e.created_at DESC
        `
      );

      res.json(result.rows);

    } catch (error) {
      console.error(
        "Fel vid hämtning av pending-artiklar:",
        error
      );

      res.status(500).json({
        message: "Kunde inte hämta väntande artiklar."
      });
    }
  }
);


app.patch(
  "/api/admin/articles/:id/moderation",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message: "Åtkomst nekad."
        });
      }

      const { status } = req.body;

      if (!["safe", "blocked"].includes(status)) {
        return res.status(400).json({
          message: "Ogiltig modereringsstatus."
        });
      }

      const result = await pool.query(
        `
        UPDATE Events
        SET
          moderation_status = $1,
          moderated_at = CURRENT_TIMESTAMP
        WHERE eventID = $2
        RETURNING
          eventID AS id,
          moderation_status AS "moderationStatus"
        `,
        [status, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Artikeln hittades inte."
        });
      }

      if (status === "safe") {
  const article = await pool.query(
    `
    SELECT
    userid,
    location
  FROM Events
  WHERE eventID = $1
    `,
    [req.params.id]
  );

  if (article.rows.length > 0) {
    const userID = article.rows[0].userid;

    await addXP(userID, "article_approved", req.params.id, 10);
    await checkActivityAchievements(userID);
    await unlockAchievement(userID, "first_article");
    if (article.rows[0].location?.trim()) {
  await unlockAchievement(
    userID,
    "first_location"
  );
}

const locationCount = await pool.query(
  `
  SELECT COUNT(DISTINCT TRIM(location)) AS count
  FROM Events
  WHERE userid = $1
    AND moderation_status = 'safe'
    AND location IS NOT NULL
    AND TRIM(location) != ''
  `,
  [userID]
);

if (Number(locationCount.rows[0].count) >= 5) {
  await unlockAchievement(
    userID,
    "local_expert"
  );
}

if (Number(locationCount.rows[0].count) >= 10) {
  await unlockAchievement(
    userID,
    "explorer"
  );
}

    const articleCount = await pool.query(
  `
  SELECT COUNT(*) AS count
  FROM Events
  WHERE userid = $1
    AND moderation_status = 'safe'
  `,
  [userID]
);

if (Number(articleCount.rows[0].count) >= 5) {
  await unlockAchievement(userID, "reporter");
}

if (Number(articleCount.rows[0].count) >= 10) {
  await unlockAchievement(userID, "local_reporter");
}

if (Number(articleCount.rows[0].count) >= 11) {
  await unlockAchievement(userID, "journalist");
}

  }
}

      res.json(result.rows[0]);

    } catch (error) {
      console.error(
        "Fel vid moderering av artikel:",
        error
      );

      res.status(500).json({
        message: "Kunde inte ändra modereringsstatus."
      });
    }
  }
);

app.get(
  "/api/admin/pending-updates",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message: "Åtkomst nekad."
        });
      }

      const result = await pool.query(
        `
        SELECT
          o.observationID AS id,
          o.eventID AS "eventID",
          o.userID,
          o.description,
          o.image_url AS "imageUrl",
          o.created_at AS "createdAt",
          u.username AS username,
          e.title AS "articleTitle",
          e.description AS "articleDescription",
          e.image_url AS "articleImageUrl",
          e.category AS "articleCategory",
          e.status AS "articleStatus",
          e.location AS "articleLocation",
          o.moderation_status AS "moderationStatus"
        FROM Observations o
        LEFT JOIN Users u
          ON u.userid = o.userID
        LEFT JOIN Events e
          ON e.eventID = o.eventID
        WHERE o.moderation_status = 'pending'
        ORDER BY o.created_at DESC
        `
      );

      res.json(result.rows);

    } catch (error) {
      console.error(
        "Fel vid hämtning av pending-uppdateringar:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte hämta väntande uppdateringar."
      });
    }
  }
);

app.patch(
  "/api/admin/updates/:id/moderation",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Admin") {
        return res.status(403).json({
          message: "Åtkomst nekad."
        });
      }

      const { status } = req.body;

      if (!["safe", "blocked"].includes(status)) {
        return res.status(400).json({
          message: "Ogiltig modereringsstatus."
        });
      }

      const result = await pool.query(
        `
        UPDATE observations
        SET
          moderation_status = $1,
          moderated_at = CURRENT_TIMESTAMP
        WHERE observationID = $2
        RETURNING
          observationID AS id,
          moderation_status AS "moderationStatus"
        `,
        [status, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Uppdateringen hittades inte."
        });
      }

      res.json(result.rows[0]);

    } catch (error) {
      console.error(
        "Fel vid moderering av uppdatering:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte ändra uppdateringens modereringsstatus."
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

            r.eventID AS "eventID",
            
            r.observationID AS "observationID",

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
            e.description AS "articleDescription",
            e.image_url AS "articleImageUrl",
            o.description AS "updateDescription",
            o.eventID AS "updateEventID",
            o.image_url AS "updateImageUrl"

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
            "Ogiltig anmälningsstatus."
        });

      }


      const reportResult =
        await pool.query(
          `
          SELECT
  reportID,
  eventID,
  observationID,
  status
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
            "Anmälan hittades inte."
        });

      }


      const report =
        reportResult.rows[0];

        if (report.status !== "pending") {
  return res.status(400).json({
    message:
      "Anmälan är redan hanterad."
  });
}


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
// REDIGERA ARTIKEL
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
      // HÄMTA ARTIKEL
      // =========================

      const eventResult = await pool.query(
        `
        SELECT
  eventID,
  userid,
  image_url,
  status
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
        status = CASE
          WHEN status = 'Removed' THEN 'Removed'
          ELSE $4
        END,
        image_url = $5,
        latitude = $6,
        longitude = $7,
        location = $8,
        moderation_status = 'pending',
        moderation_categories = NULL,
        moderation_confidence = NULL,
        moderated_at = NULL,
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
          AND moderation_status = 'safe'

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
AND e.status != 'Removed'
AND e.moderation_status = 'safe'

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

app.get("/api/users/me/achievements", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
  `
    SELECT
      a.achievementid AS "achievementID",
      a.name,
      a.description,
      a.icon,
      a.category,
      a.xpreward AS "xpReward",
      ua.unlockedat AS "unlockedAt",
      CASE
        WHEN ua.achievementid IS NOT NULL THEN true
        ELSE false
      END AS unlocked
    FROM achievements a
    LEFT JOIN userachievements ua
      ON ua.achievementid = a.achievementid
      AND ua.userid = $1
    ORDER BY a.achievementid ASC
  `,
  [req.user.userid]
);

    res.json(result.rows);
  } catch (error) {
    console.error("Fel vid hämtning av achievements:", error);
    res.status(500).json({
      message: "Kunde inte hämta achievements."
    });
  }
});

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
    AND status != 'Removed'
    AND moderation_status = 'safe'
) AS "articleCount",

            (
  SELECT COUNT(*)
  FROM EventConfirmations ec
  INNER JOIN Events e
    ON e.eventID = ec.eventID
  WHERE e.userid = $1
    AND e.status != 'Removed'
AND e.moderation_status != 'blocked'
) AS "confirmationCount",

(
  SELECT COUNT(*)
  FROM Observations o
  WHERE o.userID = $1
    AND o.moderation_status != 'blocked'
) AS updateCount

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
    AND status != 'Removed'
    AND moderation_status = 'safe'
) AS "articleCount",

            (
  SELECT COUNT(*)
  FROM EventConfirmations ec
  INNER JOIN Events e
    ON e.eventID = ec.eventID
  WHERE e.userid = $1
    AND e.status != 'Removed'
AND e.moderation_status != 'blocked'
) AS "confirmationCount",

(
  SELECT COUNT(*)
  FROM Observations o
  WHERE o.userID = $1
    AND o.moderation_status != 'blocked'
) AS updateCount

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
// HÄMTA MINA UPPDATERINGAR
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
AND e.status != 'Removed'
AND e.moderation_status = 'safe'

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
AND o.moderation_status = 'safe'

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
        "Fel vid hämtning av användarens uppdateringar:",
        error
      );


      res.status(500).json({
        message:
          "Kunde inte hämta användarens uppdateringar."
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

      if (password.length > 128) {
      return res.status(400).json({
      message:
      "Lösenordet får vara högst 128 tecken."
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
          role,
          created_at
          `,

          [
            cleanUsername,
            cleanEmail,
            passwordHash
          ]
        );


      const user = result.rows[0];

const verificationToken = require("crypto")
  .randomBytes(32)
  .toString("hex");

const verificationTokenHash = require("crypto")
  .createHash("sha256")
  .update(verificationToken)
  .digest("hex");

  await pool.query(
  `
  INSERT INTO "EmailVerificationTokens"
  (
    "userID",
    token_hash,
    expires_at
  )
  VALUES
  (
    $1,
    $2,
    CURRENT_TIMESTAMP + INTERVAL '24 hours'
  )
  `,
  [
    user.userid,
    verificationTokenHash
  ]
);

await sendVerificationEmail(
  user.email,
  user.username,
  verificationToken
);

res.status(201).json({
  message:
    "Kontot skapades. Kontrollera din e-post för att verifiera kontot."
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

app.post(
  "/api/auth/resend-verification",
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "E-postadress krävs."
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const result = await pool.query(
        `
        SELECT
          userid,
          username,
          email,
          email_verified
        FROM users
        WHERE email = $1
        `,
        [cleanEmail]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Kontot hittades inte."
        });
      }

      const user = result.rows[0];

      if (user.email_verified) {
        return res.status(400).json({
          message:
            "E-postadressen är redan verifierad."
        });
      }

      const crypto = require("crypto");

      const verificationToken =
        crypto.randomBytes(32).toString("hex");

      const verificationTokenHash =
        crypto
          .createHash("sha256")
          .update(verificationToken)
          .digest("hex");

      await pool.query(
        `
        INSERT INTO "EmailVerificationTokens"
        (
          "userID",
          token_hash,
          expires_at
        )
        VALUES
        (
          $1,
          $2,
          CURRENT_TIMESTAMP + INTERVAL '24 hours'
        )
        `,
        [
          user.userid,
          verificationTokenHash
        ]
      );

      await sendVerificationEmail(
        user.email,
        user.username,
        verificationToken
      );

      res.json({
        message:
          "Ett nytt verifieringsmejl har skickats."
      });

    } catch (error) {

      console.error(
        "Fel vid nytt verifieringsmejl:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte skicka verifieringsmejlet."
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
  created_at,
  email_verified
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

      if (!user.email_verified) {
  return res.status(403).json({
    message:
      "Du måste verifiera din e-postadress innan du kan logga in."
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

app.get(
  "/api/auth/verify-email",
  async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          message: "Verifieringstoken saknas."
        });
      }

      const tokenHash = require("crypto")
        .createHash("sha256")
        .update(token)
        .digest("hex");

      const result = await pool.query(
        `
        SELECT
          id,
          "userID",
          expires_at,
          used_at
        FROM "EmailVerificationTokens"
        WHERE token_hash = $1
        `,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          message:
            "Verifieringslänken är ogiltig."
        });
      }

      const verificationToken = result.rows[0];

      if (verificationToken.used_at) {
        return res.status(400).json({
          message:
            "Verifieringslänken har redan använts."
        });
      }

      if (
        new Date(verificationToken.expires_at) <
        new Date()
      ) {
        return res.status(400).json({
          message:
            "Verifieringslänken har gått ut."
        });
      }

      await pool.query(
        `
        UPDATE Users
        SET email_verified = TRUE
        WHERE userid = $1
        `,
        [verificationToken.userID]
      );

      await pool.query(
        `
        UPDATE "EmailVerificationTokens"
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [verificationToken.id]
      );

      res.json({
        message:
          "E-postadressen har verifierats."
      });

    } catch (error) {

      console.error(
        "Fel vid e-postverifiering:",
        error
      );

      res.status(500).json({
        message:
          "Kunde inte verifiera e-postadressen."
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
// GLOBAL FELHANTERING
// =========================

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Bilden får vara högst 5 MB."
      });
    }

    return res.status(400).json({
      message: "Fel vid bilduppladdningen."
    });
  }

  if (error) {
    console.error(
      "Ohanterat serverfel:",
      error
    );

    return res.status(500).json({
      message: "Ett oväntat serverfel inträffade."
    });
  }

  next();
});
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