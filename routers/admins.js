const express = require("express");
const { pool } = require("../dbConnect");
const { requireRole } = require("../middleware/auth");
const router = express.Router();
router.use(requireRole("admin"));
// router.get("/management", (req, res) => {
//   res.send("Admin user management");
// });

// ALL BILLING STUFF
router.get("/billing", async (req, res) => {
// psuedo member view, lists of all the names.
// when one is selected, uses that member_id in req for pt and group sessions
  const members = await pool.query(
        `SELECT "Member"."userId", "User".name
        FROM "Member"
        JOIN "User" ON "Member"."userId" = "User".id`,
    );
    res.render("admin/billing", {
        title: "Billing",
        membersList: members.rows ?? []
    });
});

router.get("/billing/data", async (req, res) => {
  const memberId = Number(req.query.memberId);
  if (!memberId) return res.status(400).send("Missing memberId");

  // personal training Sessions
  const pt = await pool.query(
    `SELECT ps.id, ps."startTime", ps."endTime",
            u.name AS trainer
     FROM "PersonalSession" ps
     JOIN "Trainer" t ON ps."trainerId" = t."userId"
     JOIN "User" u ON t."userId" = u.id
     WHERE ps."memberId" = $1`,
    [memberId]
  );

  // group classes attended
  const group = await pool.query(
    `SELECT cr."classId", ct.name AS type, u.name AS trainer, sc."startTime"
     FROM "ClassRegistration" cr
     JOIN "ScheduledClass" sc ON cr."classId" = sc.id
     JOIN "ClassType" ct ON sc."typeId" = ct.id
     JOIN "Trainer" t ON sc."trainerId" = t."userId"
     JOIN "User" u ON t."userId" = u.id
     WHERE cr."memberId" = $1 AND cr.attended = true`,
    [memberId]
  );

  res.json({
    pt: pt.rows,
    group: group.rows
  });
});


router.post("/billing/invoice", async (req, res) => {
  const { memberId, name } = req.body;

  res.render("admin/invoiceSubmitted", {
    title: "Invoice Submitted",
    name,
    memberId
  });
});


// ALL CLASS MANAGE STUFF

// our index page for the class management system, simply displays the 3 different buttons.
router.get("/classmanage", async (req, res) => {
  res.render("admin/classmanage/index", {
    title: "Class Management"
  });
});

// add a new class type. this renders the form with the new class type.
router.get("/classmanage/new", async (req, res) => {
  res.render("admin/classmanage/new", {
    title: "Add New Class Type"
  });
});

// add a new class type. this handles the new classtype and inserts the new record into the classtype table.
router.post("/classmanage/new", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("Missing class type name");

  try {
    await pool.query(
      `INSERT INTO "ClassType" (name) VALUES ($1)`,
      [name]
    );
    res.redirect("/management/classmanage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding class type");
  }
});

// show pt sessions that don't have a room assigned to them, so the admin can add them.
// get simply returns the relevant sessions.
router.get("/classmanage/pt", async (req, res) => {
  try {
    const sessions = await pool.query(
      `SELECT ps.id, ps."startTime", ps."endTime", mu.name AS "memberName", tu.name AS "trainerName"
      FROM "PersonalSession" ps
      JOIN "Member" m ON ps."memberId" = m."userId"
      JOIN "User" mu ON m."userId" = mu.id
      JOIN "Trainer" t ON ps."trainerId" = t."userId"
      JOIN "User" tu ON t."userId" = tu.id
      WHERE ps."roomId" = 0;`
    );

    const rooms = await pool.query(`SELECT id, capacity FROM "Room" ORDER BY id;`);

    res.render("admin/classmanage/pt", {
      title: "Approve PT Sessions",
      sessions: sessions.rows,
      rooms: rooms.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching PT sessions");
  }
});

// update when the admin assigns rooms.
router.post("/classmanage/pt", async (req, res) => {
  const { updates } = req.body;
  if (!updates) return res.status(400).send("Missing updates");

  try {
    const parsed = JSON.parse(updates);
    for (const u of parsed){
      await pool.query(
        `UPDATE "PersonalSession" SET "roomId" = $1 WHERE id = $2`,
        [u.roomId, u.sessionId]
      );
    }
    res.redirect("/management/classmanage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating PT sessions");
  }
});

// get existing classes 
router.get("/classmanage/group", async (req, res) => {
   try {
    const classTypes = await pool.query(`SELECT id, name FROM "ClassType" ORDER BY name;`);
    const trainers = await pool.query(`
      SELECT t."userId", u.name 
      FROM "Trainer" t 
      JOIN "User" u ON t."userId" = u.id
      ORDER BY u.name;
    `);
    const rooms = await pool.query(`
      SELECT id, capacity 
      FROM "Room" 
      WHERE allows IN ('all', 'group') 
      ORDER BY id;
    `);

    res.render("admin/classmanage/group", {
      title: "Create Group Class",
      classTypes: classTypes.rows,
      trainers: trainers.rows,
      rooms: rooms.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading data");
  }
});

// add a new class type. this renders the form with the new class type.
router.post("/classmanage/group", async (req, res) => {
  const { typeId, trainerId, roomId, startTime, endTime } = req.body;
  if (!typeId || !trainerId || !roomId || !startTime || !endTime)
    return res.status(400).send("Missing input fields");

  try {

    // 1️⃣ Figure out weekday name (lowercase)
    const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const weekday = weekdayNames[new Date(startTime).getDay()]; // e.g. "monday"

    // Extract only the HH:MM:SS portion (ignore GMT offset)
    const startTimeStr = new Date(startTime).toTimeString().split(" ")[0];
    const endTimeStr = new Date(endTime).toTimeString().split(" ")[0];

    // 1️⃣ Validate trainer availability
    const available = await pool.query(`
      SELECT 1
      FROM "Availability"
      WHERE "trainerId" = $1
      AND "day" = $2::"Weekday"
      AND "startTime" <= $3::time
      AND "endTime" >= $4::time
      LIMIT 1;
    `, [trainerId, weekday, startTimeStr, endTimeStr]);

    if (available.rows.length === 0) {
      return res.status(400).send("Trainer is not available at that time.");
    }

    // NEXT STEP: checking for class conflicts... lots of checks!

    // trainer vs PT sessions overlap
    const trainerPtConflict = await pool.query(`
      SELECT 1
      FROM "PersonalSession"
      WHERE "trainerId" = $1
        AND ("startTime" < $3 AND "endTime" > $2)
      LIMIT 1;
    `, [trainerId, startTime, endTime]);

    if (trainerPtConflict.rows.length > 0) {
      return res.status(400).send("Selected trainer has a PT session during that time.");
    }

    // room vs group classes overlap
    const roomClassConflict = await pool.query(`
      SELECT 1
      FROM "ScheduledClass"
      WHERE "roomId" = $1
        AND ("startTime" < $3 AND "endTime" > $2)
      LIMIT 1;
    `, [roomId, startTime, endTime]);

    if (roomClassConflict.rows.length > 0) {
      return res.status(400).send("Selected room is already booked for another class.");
    }

    // room vs PT sessions overlap (ignore unassigned rooms "roomId = 0")
    const roomPtConflict = await pool.query(`
      SELECT 1
      FROM "PersonalSession"
      WHERE "roomId" = $1
        AND ("startTime" < $3 AND "endTime" > $2)
      LIMIT 1;
    `, [roomId, startTime, endTime]);

    if (roomPtConflict.rows.length > 0) {
      return res.status(400).send("Room is already booked for a PT session.");
    }

    await pool.query(
      `INSERT INTO "ScheduledClass" ("typeId", "trainerId", "roomId", "startTime", "endTime") 
       VALUES ($1, $2, $3, $4, $5)`,
      [typeId, trainerId, roomId, startTime, endTime]
    );
    res.redirect("/management/classmanage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error saving group class");
  }
});

// Fetch trainer availability when selected
router.get("/classmanage/group/availability", async (req, res) => {
  const { trainerId } = req.query;
  if (!trainerId) return res.status(400).send("Missing trainerId");

  try {
    const availability = await pool.query(`
      SELECT "day", "startTime", "endTime"
      FROM "Availability"
      WHERE "trainerId" = $1
      ORDER BY 
        CASE "day"
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sunday' THEN 7
        END;
    `, [trainerId]);

    res.json({ success: true, availability: availability.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to load availability" });
  }
});


module.exports = router;
