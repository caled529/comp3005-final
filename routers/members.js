const express = require("express");
const { pool } = require("../dbConnect");
const { requireRole } = require("../middleware/auth");
const router = express.Router();

router.use(requireRole("member"));

function nextDateForWeekday(weekday) {
    const days = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0
    };

    const today = new Date();
    const dayIndex = days[weekday];

    const result = new Date(today);
    result.setDate(today.getDate() + ((7 + dayIndex - today.getDay()) % 7));
    return result;
}

router.get("/dashboard", async (req, res) => {
    // res.render("member/dashboard", { name: req.session.name });
    const memberId = req.session.userId;

    //upcoming pt sessions
    const ptSessions = await pool.query(
        `SELECT 
            ps."startTime",
            ps."endTime",
            u.name AS trainername
        FROM "PersonalSession" ps
        JOIN "User" u ON u.id = ps."trainerId"
        WHERE ps."memberId" = $1
        ORDER BY ps."startTime" ASC
        LIMIT 10;
    `, [memberId]);

    //upcoming group classes
    const classBookings = await pool.query(
        `SELECT 
            sc."startTime",
            sc."endTime",
            ct.name AS classname,
            u.name AS trainername
        FROM "ClassRegistration" cr
        JOIN "ScheduledClass" sc ON sc.id = cr."classId"
        JOIN "ClassType" ct ON ct.id = sc."typeId"
        JOIN "User" u ON u.id = sc."trainerId"
        WHERE cr."memberId" = $1
        ORDER BY sc."startTime" ASC
        LIMIT 10;
    `, [memberId]);

    // res.render("member/dashboard", {
    //     name: req.session.name,
    //     ptSessions: ptSessions.rows,
    //     classBookings: classBookings.rows
    // });
    const activeGoalResult = await pool.query(`
        SELECT id, type, target 
        FROM "Goal"
        WHERE id = (
            SELECT "activeGoalId" 
            FROM "Member"
            WHERE "userId" = $1
        );
    `, [memberId]);

    const activeGoal = activeGoalResult.rows[0] || null;

    //most recent metric
    const metricResults = await pool.query(`
        SELECT weight, bodyfat
        FROM "Metric"
        WHERE "memberId" = $1
        ORDER BY recorded DESC
        LIMIT 1;
    `, [memberId]);

    const mostRecMetric = metricResults.rows[0] || null;

    let progress = null;

    if (activeGoal && mostRecMetric) {

        if (activeGoal.type === "weight") {
            const current = mostRecMetric.weight;
            const target = activeGoal.target;

            let percent;
            if (current <= target) {
                percent = 100;
            } else {
                percent = 100 - ((current - target) / target) * 100;
            }

            progress = {
                type: "weight",
                current,
                target,
                percent: Math.max(0, percent).toFixed(1)
            };
        }

        if (activeGoal.type === "bodyFat") {
            const current = mostRecMetric.bodyfat;
            const target = activeGoal.target;

            let percent;
            if (current <= target) {
                percent = 100;
            } else {
                percent = 100 - ((current - target) / target) * 100;
            }

            progress = {
                type: "bodyFat",
                current,
                target,
                percent: Math.max(0, percent).toFixed(1)
            };
        }
}

    res.render("member/dashboard", {
        name: req.session.name,
        ptSessions: ptSessions.rows,
        classBookings: classBookings.rows,
        activeGoal,
        mostRecMetric,
        progress
    });
});


//show profile details
router.get("/profile", async (req, res) => {
    try {
        const userId = req.session.userId;
    
        //get all goals for this member
        const goalsResult = await pool.query(
            `SELECT id, type, target, created
            FROM "Goal"
            WHERE "memberId" = $1
            ORDER BY created DESC`,
            [userId]
        );

        //get the active goal
        const activeResult = await pool.query(
            `SELECT "activeGoalId"
            FROM "Member"
            WHERE "userId" = $1`,
            [userId]
        );

        const goals = goalsResult.rows;
        const activeGoalId = activeResult.rows[0]?.activeGoalId || null;

        res.render("member/profile", {
            user: req.session,
            goals,
            activeGoalId
        });
        // res.render("member/profile", { user: req.session});
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading profile");
    }
});

//update profile details
router.post("/profile", async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name, email, phone } = req.body;

        await pool.query(
            `UPDATE "User"
                SET name = $1, email = $2
                WHERE id = $3`,
                [name, email, userId]
        );
        await pool.query(
            `UPDATE "Member"
                SET phone = $1
                WHERE "userId" = $2`,
                [phone, userId]
        );

        //update session details too
        req.session.name = name;
        req.session.email = email;
        req.session.member = req.session.member || {};
        req.session.member.phone = phone;

        res.send("Profile updated!");

    } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
});

router.post("/goals", async (req, res) => {
    const userId = req.session.userId;
    const { type, target } = req.body;

    console.log("POST /goals BODY:", req.body);

    try {
        await pool.query(
            `INSERT INTO "Goal" ("memberId", type, target)
            VALUES ($1, $2, $3)`,
            [userId, type, target]
        );
        res.redirect("/profile");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating goal");
    }
});

router.post("/goals/activate", async (req, res) => {
    const userId = req.session.userId;
    const { goalId } = req.body;

    try {
        await pool.query(
        `UPDATE "Member" SET "activeGoalId" = $1
        WHERE "userId" = $2`,
        [goalId, userId]
    );
        res.redirect("/profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating active goal");
    }
});

router.post("/metrics", async (req, res) => {
    const userId = req.session.userId;
    const { weight, height, heartRate, bodyFat } = req.body;

    try {
        //get last metric entry for this user
        const last = await pool.query(
            `SELECT height, weight, heartrate, bodyfat
             FROM "Metric"
             WHERE "memberId" = $1
             ORDER BY recorded DESC
             LIMIT 1`,
            [userId]
        );
        
        const prev = last.rows[0] || {};  // {} if none exist

        // Helper: input "" → use previous → or NULL
        const valueOrPrev = (input, previous) =>
            input === "" || input === undefined
                ? (previous ?? 0)
                : Number(input);

        //build final values
        const heightVal   = valueOrPrev(height, prev.height);
        const weightVal   = valueOrPrev(weight, prev.weight);
        const heartVal    = valueOrPrev(heartRate, prev.heartrate);
        const bodyFatVal  = valueOrPrev(bodyFat, prev.bodyfat);

        //insert the new metric row
        await pool.query(
            `INSERT INTO "Metric" ("memberId", height, weight, heartrate, bodyfat)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, heightVal, weightVal, heartVal, bodyFatVal]
        );

        res.redirect("/profile");

    } catch (err) {
        console.error(err);
        res.status(500).send("Error logging health metrics");
    }
});

router.get("/history", async (req, res) => {
    const userId = req.session.userId;

    const result = await pool.query(
        `SELECT * FROM "Metric"
        WHERE "memberId" = $1
        ORDER BY "recorded" DESC`,
        [userId]
    );

    res.render("member/history", { metrics: result.rows });
});

router.get("/booking", async (req, res) => {
    const memberId = req.session.userId;

    //getting all the trainers from table
    const trainers = await pool.query(
        `SELECT "User".id as "userId", "User".name
        FROM "User"
        JOIN "Trainer" ON "User".id = "Trainer"."userId"
    `);

    //classes for registration
    //subquery for already registered AND capacity allowance
    //usage of aliases since lots of continual table references
    const classes = await pool.query(
        `SELECT 
            sc.id,
            ct.name,
            u.name AS trainername,
            sc."startTime",
            sc."endTime",
            (SELECT COUNT(*) FROM "ClassRegistration" cr WHERE cr."classId" = sc.id AND cr."memberId" = $1) > 0 AS already_registered,
            (
                SELECT r.capacity - COUNT(cr2."memberId")
                FROM "Room" r
                JOIN "ScheduledClass" sc2 ON sc2."roomId" = r.id
                LEFT JOIN "ClassRegistration" cr2 ON cr2."classId" = sc2.id
                WHERE sc2.id = sc.id
                GROUP BY r.capacity
            ) AS capacity_remaining
        FROM "ScheduledClass" sc
        JOIN "ClassType" ct ON ct.id = sc."typeId"
        JOIN "User" u ON u.id = sc."trainerId"
        ORDER BY sc."startTime";
    `, [memberId]);

    res.render("member/booking", {
        user: req.session,
        trainers: trainers.rows,
        classes: classes.rows
    });
});

//based upon the trainer selected (needs to happen first)
router.get("/availability/:trainerId", async (req, res) => {
    const trainerId = req.params.trainerId;

    try {
        //get the availability (all)
        const availResult = await pool.query(`
            SELECT day, "startTime", "endTime"
            FROM "Availability"
            WHERE "trainerId" = $1
        `, [trainerId]);

        //get the booked sessions 
        const sessionResult = await pool.query(`
            SELECT 
                EXTRACT(DOW FROM "startTime") AS dow,
                "startTime",
                "endTime"
            FROM "PersonalSession"
            WHERE "trainerId" = $1
        `, [trainerId]);

        //booked sessions map, key is day of week (dow) and values (as set) are the starting hours blocked off
        const bookedHours = {};

        const sessions = sessionResult.rows;
        const availability = availResult.rows;

        const weekdayIndex = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6
        };

        //build response
        const withoutBookings = availability.map(a => {
            const startHour = Number(a.startTime.split(":")[0]);
            const endHour = Number(a.endTime.split(":")[0]);

            let hours = [];
            for (let h = startHour; h < endHour; h++) {
                hours.push(h);
            }

            //remove the booked hours
            hours = hours.filter(h => {
                return !sessions.some(s => {
                    const sessionDay = Number(s.dow);
                    const availDay = weekdayIndex[a.day];

                    if (sessionDay !== availDay) return false;

                    const bookedDate = new Date(s.startTime);
                    const bookedStartHour = bookedDate.getHours();

                    return bookedStartHour === h;
                });
            });

            return {
                day: a.day,
                hours
            };
        });

        res.json(withoutBookings);

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});


router.get("/booking/existing/:trainerId/:day", async (req, res) => {
    const { trainerId, day } = req.params;

    const result = await pool.query(`
        SELECT "startTime", "endTime"
        FROM "PersonalSession"
        WHERE "trainerId" = $1
        AND EXTRACT(DOW FROM "startTime") = EXTRACT(DOW FROM $2::date)
    `, [trainerId, nextDateForWeekday(day).toISOString().slice(0,10)]);

    res.json(result.rows);
});

//pt sessions
router.post("/booking/session", async (req, res) => {
    const memberId = req.session.userId;
    const { trainerId, day, startTime, endTime } = req.body;

    try {
        //building real timestamps
        const date = nextDateForWeekday(day);  
        const [h, m] = startTime.split(":");

        const startTS = new Date(date);
        startTS.setHours(h, m, 0, 0);

        const endTS = new Date(startTS);
        endTS.setHours(Number(h) + 1);          //1hr blocks

        // console.log("Final start:", startTS.toISOString());
        // console.log("Final end:", endTS.toISOString());

        //insertion
        await pool.query(`
            INSERT INTO "PersonalSession" ("roomId", "trainerId", "memberId", "startTime", "endTime")
            VALUES (0, $1, $2, $3, $4)
        `, [
            trainerId,
            memberId,
            startTS.toISOString(),
            endTS.toISOString()
        ]);

    //    res.redirect("/booking?success=pt");
    res.redirect("/booking");

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});


//group classes
router.post("/booking/class", async (req, res) => {
    const memberId = req.session.userId;
    const { classId } = req.body;

    try {
        //checking capacity
        const cap = await pool.query(`
            SELECT 
                "Room".capacity,
                COUNT("ClassRegistration"."memberId") AS registered
            FROM "ScheduledClass"
            JOIN "Room" ON "ScheduledClass"."roomId" = "Room".id
            LEFT JOIN "ClassRegistration" 
                ON "ClassRegistration"."classId" = "ScheduledClass".id
            WHERE "ScheduledClass".id = $1
            GROUP BY "Room".capacity
        `, [classId]);

        const { capacity, registered } = cap.rows[0];
        if (registered >= capacity) {
            return res.send("Class is full.");
        }

        //prevention of adding duplicate registrations
        await pool.query(`
            INSERT INTO "ClassRegistration" ("classId", "memberId")
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `, [classId, memberId]);

        // res.redirect("/booking?success=class");
        res.redirect("/booking");

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

//export the router so it can be mounted in the main app
module.exports = router;