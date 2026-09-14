const express = require("express");

const {
  addWebsite,
  getWebsites,
  getUnregisteredWebsites,
  getWebsiteById,
  updateWebsite,
  unregisterWebsite,
  registerWebsite,
} = require("../controllers/website.controller");

const router = express.Router();


router.post("/", addWebsite);
router.get("/", getWebsites);
router.get("/unregistered", getUnregisteredWebsites);
router.get("/:id", getWebsiteById);
router.put("/:id", updateWebsite);
router.patch("/:id/unregister", unregisterWebsite);
router.patch("/:id/register", registerWebsite);

module.exports = router;