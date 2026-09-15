exports.up = (pgm) => {
  pgm.createTable("XPTransactions", {
    xpTransactionID: {
      type: "serial",
      primaryKey: true,
    },

    userID: {
      type: "integer",
      notNull: true,
    },

    type: {
      type: "varchar(50)",
      notNull: true,
    },

    referenceID: {
      type: "integer",
      notNull: true,
    },

    amount: {
      type: "integer",
      notNull: true,
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.addConstraint(
    "XPTransactions",
    "unique_xp_transaction",
    {
      unique: ["userID", "type", "referenceID"],
    }
  );
};

exports.down = (pgm) => {
  pgm.dropTable("XPTransactions");
};