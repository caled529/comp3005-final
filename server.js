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
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) => res.render("welcome"));

app.get("/login", (_, res) => res.render("login"));
app.post('/login', login);
app.get('/logout', logout);

app.get("/register", (_, res) => res.render("register"));
app.post("/register", registration);

// app.get("/debug", (req, res) => {
//   res.json(req.session);
// });

//member dashboard
app.get("/dashboard", requireLogin, (req, res) => {
	res.render("member/dashboard", { name: req.session.name });
});

//mounting the role routers
const memberRouter = require("./routers/members");
// app.use("/", memberRouter);
const trainerRouter = require("./routers/trainers");
// app.use("/", trainerRouter);
const adminRouter = require("./routers/admins");
// app.use("/", adminRouter);
app.use(requireRole("member"), memberRouter);
app.use(requireRole("trainer"), trainerRouter);
app.use(requireRole("admin"), adminRouter);


// app.get("/", (req, res) => {
//   res.render('pages/index');
// });


//for the invalid routes
app.use((req, res) => {
	res.status(404).send("Route not found");
});

app.listen(3000);
console.log('Listening on http://localhost:3000');
