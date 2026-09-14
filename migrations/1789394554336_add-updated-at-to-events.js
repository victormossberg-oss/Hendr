/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn("events", {
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP")
    }
  });
};

export const down = (pgm) => {
  pgm.dropColumn("events", "updated_at");
};