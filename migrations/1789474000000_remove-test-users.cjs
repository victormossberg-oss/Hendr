exports.up = async (pgm) => {
  // Testanvändarna som ska tas bort
  const userIDs = [1, 2, 3, 4, 5, 10, 11, 12];

  // Ta bort uppdateringar som skrivits av användarna
  pgm.sql(`
    DELETE FROM Observations
    WHERE userID IN (${userIDs.join(", ")});
  `);

  // Ta bort bekräftelser som gjorts av användarna
  pgm.sql(`
    DELETE FROM EventConfirmations
    WHERE userID IN (${userIDs.join(", ")});
  `);

  // Ta bort bekräftelser på artiklar som ägs av användarna
  pgm.sql(`
    DELETE FROM EventConfirmations
    WHERE eventID IN (
      SELECT eventID
      FROM Events
      WHERE userID IN (${userIDs.join(", ")})
    );
  `);

  // Ta bort uppdateringar på artiklar som ägs av användarna
  pgm.sql(`
    DELETE FROM Observations
    WHERE eventID IN (
      SELECT eventID
      FROM Events
      WHERE userID IN (${userIDs.join(", ")})
    );
  `);

  // Ta bort följningar
  pgm.sql(`
    DELETE FROM "Follows"
    WHERE "userID" IN (${userIDs.join(", ")})
       OR "eventID" IN (
         SELECT eventID
         FROM Events
         WHERE userID IN (${userIDs.join(", ")})
       );
  `);

  // Ta bort notiser där användaren är mottagare eller aktör
  pgm.sql(`
    DELETE FROM Notifications
    WHERE userID IN (${userIDs.join(", ")})
       OR actorUserID IN (${userIDs.join(", ")});
  `);

  // Ta bort XP-transaktioner
  pgm.sql(`
    DELETE FROM "XPTransactions"
    WHERE "userID" IN (${userIDs.join(", ")});
  `);

  // Ta bort artiklar som ägs av användarna
  pgm.sql(`
    DELETE FROM Events
    WHERE userID IN (${userIDs.join(", ")});
  `);

  // Ta bort själva användarna
  pgm.sql(`
    DELETE FROM Users
    WHERE userid IN (${userIDs.join(", ")});
  `);
};

exports.down = async (pgm) => {
  // Användarna och deras testdata kan inte återställas automatiskt.
};