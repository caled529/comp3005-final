INSERT INTO "User" (id, email, name, password, role) 
VALUES	
	(1, 'sofiaramirez@gmail.com', 'Sofia Ramirez', 'member', 'member'),
	(2, 'dannycharles@yahoo.com', 'Daniel Charles', 'member', 'member'),
  	(3, 'meganpete@gmail.com', 'Megan Pete', 'member', 'member'),
	(4, 'marcyhayes@aol.com', 'Marceline Hayes', 'member', 'member'),
	(5, 'sarahlee@gmail.com', 'Sarah Lee', 'trainer', 'trainer'),
  	(6, 'noahpark@aol.com', 'Noah Park', 'trainer', 'trainer'),
  	(7, 'emilycarter@outlook.com', 'Emily Carter', 'trainer', 'trainer'),
	(8, 'admin@outlook.com', 'Admin Jessica', 'admin', 'admin');

INSERT INTO "Trainer" ("userId") 
VALUES
  	(5),
	(6),
	(7);

INSERT INTO "Availability" (id, "trainerId", day, "startTime", "endTime") 
VALUES
  	(1, 5, 'monday', '10:00:00', '13:00:00'),
	(2, 5, 'tuesday', '12:00:00', '17:00:00'),
	(3, 5, 'friday', '9:00:00', '12:00:00'),
  	(4, 6, 'wednesday', '09:00:00', '15:00:00'),
	(5, 6, 'monday', '13:00:00', '17:00:00'),
	(6, 7, 'tuesday', '09:00:00', '12:00:00'),
	(7, 7, 'thursday', '09:00:00', '16:00:00'),
	(8, 7, 'friday', '12:00:00', '17:00:00');

INSERT INTO "ClassType" 
VALUES
  	(1, 'Pilates'),
  	(2, 'Hot Yoga'),
	(3, 'Spin Class'),
	(4, 'Zumba');

INSERT INTO "Member" ("userId", birthdate, gender, phone) 
VALUES 
  	(1, '2005-01-01', 'female', '9059886437'),
  	(2, '1999-01-01', 'male', '9042485460'),
  	(3, '1997-01-01', 'female', '1271271277'),
  	(4, '1963-01-01', 'female', '5820435830');

INSERT INTO "Room" 
VALUES
  	(1, 25, 'group'),
 	(2, 2, 'personal'),
  	(3, 30, 'all'),
	(0, 999, 'all');

INSERT INTO "ScheduledClass" (id, "typeId", "roomId", "trainerId", "startTime", "endTime") 
VALUES
  	(1, 1, 1, 5, '2025-12-02 12:00:00', '2025-12-02 13:00:00'),
  	(2, 2, 3, 5, '2025-12-02 14:00:00', '2025-12-02 15:00:00'),
  	(3, 4, 1, 5, '2025-12-05 16:00:00', '2025-12-05 17:00:00'),
	(4, 3, 2, 6, '2025-12-03 10:00:00', '2025-12-03 11:00:00'),
	(5, 2, 1, 6, '2025-12-01 14:00:00', '2025-12-01 15:00:00'),
	(6, 1, 3, 6, '2025-12-02 09:30:00', '2025-12-02 10:30:00'),
	(7, 1, 2, 7, '2025-12-04 14:30:00', '2025-12-04 15:30:00'),
	(8, 1, 1, 7, '2025-12-05 13:30:00', '2025-12-05 14:30:00');



INSERT INTO "ClassRegistration" ("classId", "memberId", attended) 
VALUES
	(1, 1, true),
	(2, 1, true),
	(5, 1, true),
	(6, 1, true),
	(3, 4, true),
	(8, 4, true);

INSERT INTO "PersonalSession" (id, "roomId", "trainerId", "memberId", "startTime", "endTime") 
VALUES
  (1, 2, 6, 1, '2025-12-03 13:00:00', '2025-12-03 14:00:00'),
  (2, 3, 7, 1, '2025-12-05 10:00:00', '2025-12-05 11:00:00'),
  (3, 3, 5, 4, '2025-12-02 11:00:00', '2025-12-02 12:00:00');
