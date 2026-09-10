const express = require("express");

const {
  addWebsite,
  getWebsites,
  getWebsiteById,
  updateWebsite,
  unregisterWebsite,
  registerWebsite,
} = require("../controllers/website.controller");

const router = express.Router();

// Add Website
router.post("/", addWebsite);

// Get Websites
// type = all | premium | showResult | unregistered
router.get("/", getWebsites);

// Get Single Website
router.get("/:id", getWebsiteById);

// Update Website
router.put("/:id", updateWebsite);

// Unregister Website - Soft Delete
router.patch("/:id/unregister", unregisterWebsite);

// Register Website Again
router.patch("/:id/register", registerWebsite);

module.exports = router;