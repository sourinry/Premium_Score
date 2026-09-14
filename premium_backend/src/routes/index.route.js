const express = require("express");

const websiteRoutes = require("./website.routes");

const router = express.Router();

router.use("/websites", websiteRoutes);

module.exports = router;