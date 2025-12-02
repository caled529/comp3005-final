const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require("fs");
// const dotenv = require("dotenv");
const { pool } = require("./dbConnect");
const { login, logout, requireLogin, requireRole } = require("./middleware/auth");
const { registration } = require("./registration.js");

// dotenv.config();
const app = express();

app.use(session({
	secret: "secretive",
	resave: false,
	saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true })); //for form data parsing
app.use(express.json());

app.set('view engine', 'pug');
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
// app.use(express.static(path.join(__dirname, "public")));

//PUBLIC ROUTES
app.get("/", (req, res) => { res.render("homepage");});
app.get("/login", (_, res) => res.render("login"));
app.post('/login', login);
app.get('/logout', logout);

app.get("/register", (_, res) => res.render("register"));
app.post("/register", registration);

app.get('/logout', logout);

//PROTECTED ROUTES
//member
app.get("/dashboard", requireLogin, (req, res) => {
    res.redirect("/member/dashboard");
});
app.get("/profile", requireLogin, (req, res) => {
    res.redirect("/member/profile");
});
app.get("/booking", requireLogin, (req, res) => {
     res.redirect("/member/booking");
});
app.get("/history", requireLogin, (req, res) => {
    res.redirect("/member/history");
});

app.get("/trainer", requireRole("trainer"), (_, res) => res.render("headers/trainerheader"));

app.get("/trainer/schedule", requireRole("trainer"), async (req, res) => {
	try {
		const trainerId = req.session.userId;
		const classesResult = await pool.query(`
			SELECT 
				sc."startTime" as start,
				sc."endTime" as end,
				sc."roomId" as room,
				ct.name,
				COUNT(cr."memberId") as registered
			FROM "ScheduledClass" sc
			JOIN "ClassType" ct ON sc."typeId" = ct.id
			LEFT JOIN "ClassRegistration" cr ON sc.id = cr."classId"
			WHERE sc."endTime" > NOW()
			AND sc."trainerId" = $1
			GROUP BY sc.id, sc."startTime", sc."endTime", sc."roomId", ct.name
			ORDER BY sc."startTime"
		`, [trainerId]);

		const sessionsResult = await pool.query(`
			SELECT 
				ps."startTime" as start,
				ps."endTime" as end,
				ps."roomId" as room,
				u.name as member
			FROM "PersonalSession" ps
			JOIN "Member" m ON ps."memberId" = m."userId"
			JOIN "User" u ON m."userId" = u.id
			WHERE ps."endTime" > NOW()
			AND ps."trainerId" = $1
			ORDER BY ps."startTime"
		`, [trainerId]);

		res.render("trainer/schedule", {
			classes: classesResult.rows.map((c) => {
				return {
					...c,
					date: c.start.toDateString(),
					start: c.start.toLocaleTimeString(),
					end: c.end.toLocaleTimeString(),
				};
			}),
			sessions: sessionsResult.rows.map((s) => {
				return {
					...s,
					date: s.start.toDateString(),
					start: s.start.toLocaleTimeString(),
					end: s.end.toLocaleTimeString(),
				};
			}),
		});
	} catch (error) {
		console.error(`${new Date().toString()} | ERROR: ${error}`);
		res.sendStatus(500);
	}
});

app.get("/trainer/lookup", requireRole("trainer"), async (req, res) => {
	try {
		const name = req.query.name?.trim() ?? "";
		let members = [];

		if (name.length > 0) {
			const result = await pool.query(`
				SELECT * FROM "MemberLookup"
				WHERE LOWER(name) LIKE LOWER($1)
				ORDER BY name
			`, [`%${name}%`]);
			members = result.rows;
		}
		res.render("trainer/lookup", {
			members: members.map((m) => {
				return {
					...m,
					height: m.height ? `${m.height} cm` : "",
					weight: m.weight ? `${m.weight} kg` : "",
					heartrate: m.heartrate ?? "",
					bodyfat: m.bodyfat ? `${m.bodyfat}%` : "",
					goalType: m.goalType ?? "",
					target: m.target ?? "",
					recorded: m.recorded?.toISOString() ?? "",
				}
			}),
			name
		});
	} catch (error) {
		console.error(`${new Date().toString()} | ERROR: ${error}`);
		res.sendStatus(500);
	}
});

app.get("/trainer/availability", requireRole("trainer"), async (req, res) => {
	try {
		const result = await pool.query(`
			SELECT id, day, "startTime"::TEXT, "endTime"::TEXT, date
			FROM "Availability"
			WHERE "trainerId" = $1
			ORDER BY day, "startTime"
		`, [req.session.userId]);

		const weekly = result.rows.filter((r) => r.date === null);
		const oneTime = result.rows.filter((r) => r.date !== null);

		res.render("trainer/availability", {
			weekly: weekly.map((w) => {
				return {
					...w,
					day: w.day.charAt(0).toUpperCase() + w.day.slice(1),
				}
			}),
			oneTime: oneTime.map((o) => {
				return {
					...o,
					date: o.date.toDateString(),
				}
			}),
			error: null
		});
	} catch (error) {
		console.error(`${new Date().toString()} | ERROR: ${error}`);
		res.sendStatus(500);
	}
});

app.post("/trainer/availability", requireRole("trainer"), async (req, res) => {
	try {
		const trainerId = req.session.userId;
		const { day, startTime, endTime, date } = req.body;

		const result = await pool.query(`
			SELECT id FROM "Availability"
			WHERE "trainerId" = $1
			AND day = $2
			AND (date IS NULL OR date = $3 OR $3 IS NULL)
			AND (
				("startTime" <= $4 AND "endTime" > $4) OR
				("startTime" < $5 AND "endTime" >= $5) OR
				("startTime" >= $4 AND "endTime" <= $5)
			)
		`, [trainerId, day, date || null, startTime, endTime]);

		if (result.rows.length > 0) {
			const result = await pool.query(`
			SELECT id, day, "startTime"::TEXT, "endTime"::TEXT, date
			FROM "Availability"
			WHERE "trainerId" = $1
			ORDER BY day, "startTime"
		`, [trainerId]);

			const weekly = result.rows.filter((r) => r.date === null);
			const oneTime = result.rows.filter((r) => r.date !== null);

			res.render("trainer/availability", {
				weekly: weekly.map((w) => {
					return {
						...w,
						day: w.day.charAt(0).toUpperCase() + w.day.slice(1),
					}
				}),
				oneTime: oneTime.map((o) => {
					return {
						...o,
						date: o.date.toDateString(),
					}
				}),
				error: "Overlapping availability is not permitted."
			});
		} else {
			await pool.query(`
				INSERT INTO "Availability"
					("trainerId", day, "startTime", "endTime", date)
					VALUES ($1, $2, $3, $4, $5)
			`, [trainerId, day, startTime, endTime, date || null]);
			res.redirect("/trainer/availability");
		}
	} catch (error) {
		console.error(`${new Date().toString()} | ERROR: ${error}`);
		res.sendStatus(500);
	}
});

//mounting the role routers
const memberRouter = require("./routers/members");
const trainerRouter = require("./routers/trainers");
const adminRouter = require("./routers/admins");
app.use("/member", requireRole("member"), memberRouter);
app.use(requireRole("trainer"), trainerRouter);
app.use(requireRole("admin"), adminRouter);

//for the invalid routes
app.use((req, res) => {
	res.status(404).send("Route not found");
});

app.listen(3000);
console.log('Listening on http://localhost:3000');
