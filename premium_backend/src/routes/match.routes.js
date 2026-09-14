const express = require("express");

const {
  getMatches,
  getOldMatches,
  getMatchById,
} = require("../controllers/match.controller");

const router = express.Router();

router.get("/", getMatches);
router.get("/old", getOldMatches);
router.get("/:eventId", getMatchById);

module.exports = router;
