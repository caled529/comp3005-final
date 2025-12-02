CREATE TYPE "Role" AS ENUM (
	'admin',
	'member',
	'trainer'
);

CREATE TABLE "User" (
  id        SERIAL  PRIMARY KEY,
  email     TEXT    UNIQUE NOT NULL,
  password  TEXT    NOT NULL,
  name      TEXT    NOT NULL,  
  role      "Role"  NOT NULL DEFAULT 'member'
);

CREATE TYPE "Gender" AS ENUM (
  'male',
  'female',
  'other'
);

CREATE TABLE "Member" (
  "userId"        INTEGER   PRIMARY KEY,
  birthdate       DATE      NOT NULL,
  gender          "Gender"  NOT NULL,
  phone           TEXT      NOT NULL,
  "activeGoalId"  INTEGER   UNIQUE DEFAULT NULL,
  FOREIGN KEY ("userId")
    REFERENCES "User"(id)
);

CREATE TYPE "GoalType" AS ENUM (
  'weight',
  'bodyFat'
);

CREATE TABLE "Goal" (
  id          SERIAL      PRIMARY KEY,
  "memberId"  INTEGER     NOT NULL,
  type        "GoalType"  NOT NULL,
  target      REAL        NOT NULL,
  created     TIMESTAMP   NOT NULL DEFAULT NOW(),
	FOREIGN KEY ("memberId")
		REFERENCES "Member"("userId")
);

-- has to be added to "Member" table after Goal table is instantiated
ALTER TABLE "Member" ADD CONSTRAINT "member_activeGoal_fk"
  FOREIGN KEY ("activeGoalId")
    REFERENCES "Goal"(id);

CREATE TABLE "Metric" (
  "memberId"  INTEGER    NOT NULL,
  recorded    TIMESTAMP  NOT NULL DEFAULT NOW(),
  height      REAL       NOT NULL,
  weight      REAL       NOT NULL,
  heartrate   SMALLINT   NOT NULL,
  bodyfat     REAL       NOT NULL,
  PRIMARY KEY ("memberId", recorded),
  FOREIGN KEY ("memberId")
    REFERENCES "Member"("userId")
);

-- makes the lateral join in the MemberLookup view faster
CREATE INDEX "MemberMetricIndex"
  ON "Metric" ("memberId", recorded DESC);

CREATE VIEW "MemberLookup" AS
  SELECT 
    u.name,
    mt.recorded,
    mt.height,
    mt.weight,
    mt.heartrate,
    mt.bodyfat,
    g.type as "goalType",
    g.target as "goalTarget"
  FROM "User" u
  JOIN "Member" m ON u.id = m."userId"
  LEFT JOIN "Goal" g ON m."activeGoalId" = g.id
  LEFT JOIN LATERAL (
    SELECT *
    FROM "Metric" 
    WHERE "memberId" = m."userId"
    ORDER BY recorded DESC
    LIMIT 1
  ) mt ON true;

CREATE TABLE "Trainer" (
  "userId"  INTEGER  PRIMARY KEY,
  FOREIGN KEY ("userId")
    REFERENCES "User"(id) 
);

CREATE TYPE "Weekday" AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

CREATE TABLE "Availability" (
  id           SERIAL     PRIMARY KEY,
  "trainerId"  INTEGER    NOT NULL,
  day          "Weekday"  NOT NULL,
  "startTime"  TIME       NOT NULL,
  "endTime"    TIME       NOT NULL,
  date         DATE       DEFAULT NULL, -- non-null date indicates one-time availability
  FOREIGN KEY ("trainerId")
    REFERENCES "Trainer"("userId")
);

CREATE TYPE "BookingType" AS ENUM (
  'all',
  'group',
  'personal'
);

CREATE TABLE "Room" (
  id        SERIAL         PRIMARY KEY,
  capacity  INTEGER        NOT NULL,
  allows    "BookingType"  NOT NULL DEFAULT 'all'
);

CREATE TABLE "PersonalSession" (
  id           SERIAL     PRIMARY KEY,
  "roomId"     INTEGER    NOT NULL,
  "trainerId"  INTEGER    NOT NULL,
  "memberId"   INTEGER    NOT NULL,
  "startTime"  TIMESTAMP  NOT NULL,
  "endTime"    TIMESTAMP  NOT NULL,
  FOREIGN KEY ("roomId")
    REFERENCES "Room"(id),
  FOREIGN KEY ("trainerId")
    REFERENCES "Trainer"("userId"),
  FOREIGN KEY ("memberId")
    REFERENCES "Member"("userId")
);

CREATE TABLE "ClassType" (
  id    SERIAL  PRIMARY KEY,
  name  TEXT    NOT NULL
	-- could add a description field
);

CREATE TABLE "ScheduledClass" (
  id           SERIAL     PRIMARY KEY,
  "typeId"     INTEGER    NOT NULL,
  "roomId"     INTEGER    NOT NULL,
  "trainerId"  INTEGER    NOT NULL,
  "startTime"  TIMESTAMP  NOT NULL,
  "endTime"    TIMESTAMP  NOT NULL,
  FOREIGN KEY ("typeId")
    REFERENCES "ClassType"(id),
  FOREIGN KEY ("roomId")
    REFERENCES "Room"(id),
  FOREIGN KEY ("trainerId")
    REFERENCES "Trainer"("userId")
);

CREATE TABLE "ClassRegistration" (
  "classId"   INTEGER  NOT NULL,
  "memberId"  INTEGER  NOT NULL,
  attended    BOOLEAN  NOT NULL DEFAULT false,
  PRIMARY KEY ("classId", "memberId"),
  FOREIGN KEY ("classId")
    REFERENCES "ScheduledClass"(id),
  FOREIGN KEY ("memberId")
    REFERENCES "Member"("userId")
);


CREATE OR REPLACE FUNCTION set_active_goal()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Member"
    SET "activeGoalId" = NEW.id
    WHERE "userId" = NEW."memberId";

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activate_latest_goal
AFTER INSERT ON "Goal"
FOR EACH ROW
EXECUTE FUNCTION set_active_goal();
