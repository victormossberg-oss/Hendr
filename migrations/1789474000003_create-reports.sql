CREATE TABLE Reports (
    reportID SERIAL PRIMARY KEY,

    eventID INTEGER,

    observationID INTEGER,

    reportedBy INTEGER NOT NULL,

    reason VARCHAR(50) NOT NULL,

    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    reviewedBy INTEGER,

    reviewed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);