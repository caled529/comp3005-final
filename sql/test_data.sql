INSERT INTO "User" (id, email, name, password, role) VALUES
  (1, 'hey@gmail.com', 'Hey', 'testing', 'member'),
  (2, 'tomi@testing.com', 'Tomi', 'Pizza', 'member'),
  (3, 'megan@gym.com', 'Megan', 'trainer', 'trainer'),
  (4, 'sarah@testing.com', 'Sarah Park', 'parksarah', 'member'),
  (5, 'admin@gym.com', 'Admin', 'admin', 'admin'),
  (6, 'emily@gym.com', 'Emily Carter', 'trainer', 'trainer');

INSERT INTO "Trainer" VALUES
  (3),
  (6);

INSERT INTO "Availability" VALUES
  (1, 3, 'monday', '10:00:00', '14:00:00', NULL),
  (2, 6, 'monday', '09:00:00', '12:00:00', NULL);

INSERT INTO "ClassType" VALUES
  (1, 'Pilates'),
  (2, 'Hot Yoga');

INSERT INTO "Member" VALUES 
  (1, '1970-01-01', 'male', '5555588885', NULL),
  (4, '1970-01-01', 'female', '6406867430', NULL),
  (2, '1970-01-01', 'female', '1271271277', NULL);

INSERT INTO "Room" VALUES
  (1, 25, 'group'),
  (2, 2, 'personal'),
  (3, 30, 'all');

INSERT INTO "ScheduledClass" VALUES
  (1, 1, 1, 3, '1970-01-01 00:00:00', '1970-01-01 00:00:00'),
  (2, 2, 1, 3, '2025-12-02 16:00:00', '2025-12-02 16:30:00'),
  (3, 2, 1, 3, '2025-12-01 10:30:00', '2025-12-01 11:00:00');

INSERT INTO "ClassRegistration" VALUES
  (1, 4, true);

INSERT INTO "PersonalSession" VALUES
  (1, 2, 3, 2, '2025-12-01 10:00:00', '2025-12-01 10:30:00');
