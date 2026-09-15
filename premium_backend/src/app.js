const express = require("express");
const cors = require("cors");

const routes = require("./routes/index.route");

const {
  startMatchScheduler,
} = require("./services/matchScheduler.service");

const {
  startPremiumScheduler,
} = require("./services/premiumScheduler.service");

const {
  startScoreIdSync,
} = require("./services/matchScore.service");

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// =====================================================
// MATCH SYNC
// =====================================================

startMatchScheduler();


// =====================================================
// PREMIUM SCORE + FANCY SCHEDULER
// =====================================================

startPremiumScheduler();


// =====================================================
// SCORE ID SYNC
// =====================================================

startScoreIdSync();


// =====================================================
// HEALTH
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Premium Score API is running",
  });
});


// =====================================================
// API
// =====================================================

app.use(
  "/api/v1",
  routes
);


app.use((req, res) => {
  console.log(
    "❌ UNMATCHED:",
    req.method,
    req.originalUrl
  );

  res.status(404).json({
    success: false,
    message:
      "Route not found",

    path:
      req.originalUrl,
  });
});


module.exports = app;