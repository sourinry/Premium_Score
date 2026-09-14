const express = require("express");

const {
  getMatches,
  getMatchById,
} = require("../controllers/match.controller");

const router = express.Router();

router.get("/", getMatches);

router.get("/:eventId", getMatchById);

module.exports = router;