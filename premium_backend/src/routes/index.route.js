const express = require("express");

const websiteRoutes = require("./website.routes");
const matchRoutes = require("./match.routes");
const fancyRoutes= require("./fancy.routes")

const router = express.Router();

router.use("/websites", websiteRoutes);
router.use("/matches", matchRoutes);
router.use("/fancy", fancyRoutes)


module.exports = router;