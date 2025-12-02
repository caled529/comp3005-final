const { pool } = require("../dbConnect");

//login needs to match email + password from db
async function login(req, res) {
    const { email, password } = req.body;

    //fetch users from user table to reference
    const result = await pool.query(
        `SELECT id, email, name, role, password 
        FROM "User" 
        WHERE email = $1`, //position parameter first arg
        [email]
    );

    //no matches found for email
    if (result.rows.length === 0) {
        return res.status(401).send("Invalid email");
    }
    //else we have a matching user
    const user = result.rows[0];

    //password comparing
    if (user.password !== password) {
        return res.status(401).send("Wrong password");
    }

    //store login details into the session
    req.session.loggedin = true;
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.name = user.name;
    req.session.role = user.role;

    // console.log(user.role);
    // console.log(user.name);

    //additional parameters added if member role
    if (user.role === "member") {
        const memberResult = await pool.query(
            `SELECT birthdate, gender, phone 
            FROM "Member" 
            WHERE "userId" = $1`,
            [user.id]
    );
        if (memberResult.rows.length > 0) {
            const member = memberResult.rows[0];

            req.session.member = {
                birthdate: member.birthdate,
                gender: member.gender,
                phone: member.phone
        };
        }
    }

    //routing now based on role
    switch (req.session.role) {
        case "member":
            return res.redirect("/dashboard");
        case "trainer":
            return res.redirect("/schedule");
        case "admin":
            return res.redirect("/management");
        default:
            return res.redirect("/");
    }
    
    //   return res.status(200).send("Logged in");
}

//logout
function logout(req, res) {
  req.session.destroy(() => {
    res.send("Logged out");
  });
}

//authentication
function requireLogin(req, res, next) {
  if (!req.session.loggedin) {
    return res.status(401).send("You must be logged in");
  }
  next();
}

//authorization for specific role
function requireRole(role) {
  console.log("Entering requireRole function with " + role);
  return (req, res, next) => {
    if (!req.session.loggedin) {
      console.log("I'm in You're not logged in!");
      console.log(req.session.role);
      return res.status(401).send("You must be logged in");
    }
    if (req.session.role !== role) {
      console.log("I'm in you're not authorized!");
      console.log(req.session.role);
      console.log(role);
      return res.status(403).send("Forbidden");
    }
    next();
  };
}

module.exports = {
  login,
  logout,
  requireLogin,
  requireRole
};








// function auth(req, res, next) {
//   //check: is there a loggedin property for this session
//     if(!req.session.loggedin || !users[req.session.username].admin){
//         res.status(401).send("Unauthorized");
//         return;
//     }

//     next();
// };

// function admin(req, res, next){
//     res.status(200).send("Welcome to the admin page " + req.session.username);
//     return;
// }

// //If the username and password match somebody in our database,
// // then create a new session ID and save it in the database.
// //That session ID will be associated with the requesting user
// function login(req, res, next){
//     if(req.session.loggedin){
//         res.status(200).send("Already logged in.");
//         return;
//     }

//     let username = req.body.username;
//     let password = req.body.password;

//   console.log("Logging in with credentials:");
//   console.log("Username: " + req.body.username);
//   console.log("Password: " + req.body.password);

//   if(!users.hasOwnProperty(req.body.username)){
//     res.status(401).send("Unauthorized");
//     return;
//   }

//   if(users[req.body.username].password === req.body.password){ //authenticated correctly
//     req.session.loggedin = true; //now this session has a loggedin value

//     //We set the username associated with this session
//     //On future requests, we KNOW who the user is
//     //We can look up their information specifically
//     //We can authorize based on who they are
//     req.session.username = username;
//     res.status(200).send("Logged in");
//   }else{
//     res.status(401).send("Not authorized. Invalid password.");
//   }
// }

// //undoing; so getting rid of the values we set and indicate the person is NOT loggedin
// function logout(req, res, next){
//     if(req.session.loggedin){
//         req.session.loggedin = false;
//     req.session.username = undefined;
//         res.status(200).send("Logged out.");
//     }else{
//         res.status(200).send("You cannot log out because you aren't logged in.");
//     }
// }
