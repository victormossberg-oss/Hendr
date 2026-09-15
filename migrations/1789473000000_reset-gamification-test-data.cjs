exports.up = async (pgm) => {
  pgm.sql(`
    DELETE FROM "XPTransactions"
    WHERE "userID" IN (7, 13);
  `);

  pgm.sql(`
    UPDATE Users
    SET
      xp = 0,
      level = 1
    WHERE userid IN (7, 13);
  `);
};

exports.down = async (pgm) => {
  // Testdata återställs inte vid rollback.
};