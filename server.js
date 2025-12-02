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

//ROUTES FOR ALL
app.get("/", (req, res) => { res.render("homepage");});
app.get('/login', (req, res) => { res.render("login"); });
app.post('/login', login);
app.get('/logout', logout);

app.get("/register", (_, res) => res.render("register"));
require("./registration.js").setup(app);

//PROTECTED ROUTES
//member
app.get("/dashboard", requireLogin, (req, res) => {
    //console.log("I'm in server.js, member dashboard!!!");
    res.render("member/dashboard", { name: req.session.name });
});

//admin billing
app.get("/management", requireLogin, (req, res) => {
    //console.log("I'm in server.js in management!!!");
    res.render("admin/management");
});

//mounting the role routers
const memberRouter = require("./routers/members");
// app.use("/", memberRouter);
const trainerRouter = require("./routers/trainers");
// app.use("/", trainerRouter);
const adminRouter = require("./routers/admins");
// app.use("/", adminRouter);
app.use("/management", adminRouter);
//app.use("/billing", adminRouter);
// app.use(adminRouter);
// app.use(memberRouter);
// app.use(trainerRouter);
// app.use(requireRole("admin"), adminRouter);
// app.use(requireRole("member"), memberRouter);
// app.use(requireRole("trainer"), trainerRouter);

//app.use(requireRole("admin"), adminRouter);


// app.get("/", (req, res) => {
//   res.render('pages/index');
// });


//for the invalid routes
app.use((req, res) => {
    res.status(404).send("Route not found");
});

app.listen(3000);
console.log('Listening on http://localhost:3000');
