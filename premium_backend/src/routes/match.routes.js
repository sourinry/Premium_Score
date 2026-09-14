const express = require("express");

const {
  getMatches,
  getOldMatches,
  getMatchById,
} = require("../controllers/match.controller");

const router = express.Router();

// =====================================================
// CURRENT MATCHES
// =====================================================

router.get(
  "/",
  getMatches
);

// =====================================================
// OLD MATCHES
// IMPORTANT: /old MUST BE BEFORE /:eventId
// =====================================================

router.get(
  "/old",
  getOldMatches
);

// =====================================================
// SINGLE MATCH
// =====================================================

router.get(
  "/:eventId",
  getMatchById
);

module.exports = router;