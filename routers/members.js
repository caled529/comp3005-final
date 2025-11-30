const express = require("express");
const { pool } = require("../dbConnect");
const { requireRole } = require("../middleware/auth");
const router = express.Router();

router.use(requireRole("member"));

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



// app.get("/profile/:id", async (req, res) => {
//   const result = await pool.query("SELECT * FROM users WHERE id=$1", [
//     req.params.id,
//   ]);
//   res.render("profile", { user: result.rows[0] });
// });

//export the router so it can be mounted in the main app
module.exports = router;