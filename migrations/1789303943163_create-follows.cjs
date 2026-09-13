exports.up = (pgm) => {
  pgm.createTable("Follows", {
    followID: {
      type: "serial",
      primaryKey: true
    },

    userID: {
      type: "integer",
      notNull: true
    },

    eventID: {
      type: "integer",
      notNull: true
    },

    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP")
    }
  });

  pgm.addConstraint("Follows", "unique_user_event_follow", {
    unique: ["userID", "eventID"]
  });
};

exports.down = (pgm) => {
  pgm.dropTable("Follows");
};