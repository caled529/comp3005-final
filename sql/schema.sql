CREATE TYPE Role AS ENUM (
	'admin',
	'member',
	'trainer'
);

CREATE TABLE GymUser ( -- 'User' is a reserved word in pg
  id     SERIAL  PRIMARY KEY,
  email  TEXT    UNIQUE NOT NULL,
  name   TEXT    NOT NULL,  
  role   Role    NOT NULL DEFAULT 'member'
);

CREATE TYPE Gender AS ENUM (
  'male',
  'female',
  'other'
);

CREATE TABLE Member (
  userId        INTEGER  PRIMARY KEY,
  birthdate     DATE     NOT NULL,
  gender        Gender   NOT NULL,
  phone         TEXT     NOT NULL,
  activeGoalId  INTEGER  UNIQUE DEFAULT NULL,
  FOREIGN KEY (userId)
    REFERENCES GymUser(id)
);

CREATE TYPE GoalType AS ENUM (
  'weight',
  'bodyFat'
);

CREATE TABLE Goal (
  id        SERIAL     PRIMARY KEY,
  memberId  INTEGER    NOT NULL,
  type      GoalType   NOT NULL,
  target    REAL       NOT NULL,
  created   TIMESTAMP  NOT NULL DEFAULT NOW(),
	FOREIGN KEY (memberId)
		REFERENCES Member(userId)
);

-- has to be added to Member table after Goal table is instantiated
ALTER TABLE Member ADD CONSTRAINT member_activeGoal_fk
  FOREIGN KEY (activeGoalId)
    REFERENCES Goal(id);

CREATE TABLE Metric (
  memberId   INTEGER    NOT NULL,
  recorded   TIMESTAMP  NOT NULL DEFAULT NOW(),
  height     REAL       NOT NULL,
  weight     REAL       NOT NULL,
  heartRate  SMALLINT   NOT NULL,
  bodyFat    REAL       NOT NULL,
  PRIMARY KEY (memberId, recorded),
  FOREIGN KEY (memberId)
    REFERENCES Member(userId)
);

CREATE TABLE Trainer (
  userId  INTEGER  PRIMARY KEY,
  FOREIGN KEY (userId)
    REFERENCES GymUser(id) 
);

CREATE TYPE Weekday AS ENUM (
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

CREATE TABLE Availability (
  id         SERIAL   PRIMARY KEY,
  trainerId  INTEGER  NOT NULL,
  day        Weekday  NOT NULL,
  startTime  TIME     NOT NULL,
  endTime    TIME     NOT NULL,
  date       DATE     DEFAULT NULL, -- non-null date indicates one-time availability
  FOREIGN KEY (trainerId)
    REFERENCES Trainer(userId)
);

CREATE TYPE BookingType AS ENUM (
  'all',
  'group',
  'personal'
);

CREATE TABLE Room (
  id        SERIAL       PRIMARY KEY,
  capacity  INTEGER      NOT NULL,
  allows    BookingType  NOT NULL DEFAULT 'all'
);

CREATE TABLE PersonalSession (
  id         SERIAL     PRIMARY KEY,
  roomId     INTEGER    NOT NULL,
  trainerId  INTEGER    NOT NULL,
  memberId   INTEGER    NOT NULL,
  startTime  TIMESTAMP  NOT NULL,
  endTime    TIMESTAMP  NOT NULL,
  FOREIGN KEY (roomId)
    REFERENCES Room(id),
  FOREIGN KEY (trainerId)
    REFERENCES Trainer(userId),
  FOREIGN KEY (memberId)
    REFERENCES Member(userId)
);

CREATE TABLE ClassType (
  id    SERIAL  PRIMARY KEY,
  name  TEXT    NOT NULL
	-- could add a description field
);

CREATE TABLE ScheduledClass (
  id         SERIAL     PRIMARY KEY,
  typeId     INTEGER    NOT NULL,
  roomId     INTEGER    NOT NULL,
  trainerId  INTEGER    NOT NULL,
  startTime  TIMESTAMP  NOT NULL,
  endTime    TIMESTAMP  NOT NULL,
  FOREIGN KEY (typeId)
    REFERENCES ClassType(id),
  FOREIGN KEY (roomId)
    REFERENCES Room(id),
  FOREIGN KEY (trainerId)
    REFERENCES Trainer(userId)
);

CREATE TABLE ClassRegistration (
  classId   INTEGER  NOT NULL,
  memberId  INTEGER  NOT NULL,
  attended  BOOLEAN  NOT NULL DEFAULT false,
  PRIMARY KEY (classId, memberId),
  FOREIGN KEY (classId)
    REFERENCES ScheduledClass(id),
  FOREIGN KEY (memberId)
    REFERENCES Member(userId)
);
