const express = require("express");

const websiteRoutes = require("./website.routes");
const matchRoutes = require("./match.routes");

const router = express.Router();

router.use("/websites", websiteRoutes);
router.use("/matches", matchRoutes);


module.exports = router;