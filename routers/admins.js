const express = require("express");
const router = express.Router();

router.get("/management", (req, res) => {
  res.send("Admin user management");
});

module.exports = router;