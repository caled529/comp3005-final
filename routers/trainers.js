const express = require("express");
const router = express.Router();

router.get("/schedule", (req, res) => {
  res.send("Trainer schedule");
});

module.exports = router;