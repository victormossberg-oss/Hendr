exports.up = (pgm) => {
  pgm.addColumns("users", {
    xp: {
      type: "integer",
      notNull: true,
      default: 0
    },
    level: {
      type: "integer",
      notNull: true,
      default: 1
    }
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("users", ["xp", "level"]);
};