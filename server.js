const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require("fs");
// const dotenv = require("dotenv");
const { pool } = require("./dbConnect");
const { login, logout, requireLogin, requireRole } = require("./middleware/auth");

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


app.post('/login', login);
app.get('/logout', logout);

app.get("/", (req, res) => {
    // console.log("env db_user:", process.env.db_user);
    // console.log("env db_password:", process.env.db_password);
    res.render("login");   // this loads views/login.pug
});

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