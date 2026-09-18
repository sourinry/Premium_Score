const express = require("express");
const cors = require("cors");

const routes = require("./routes/index.route");

const { startMatchScheduler } = require("./services/matchScheduler.service");
const {
  startPremiumScheduler,
} = require("./services/premiumScheduler.service");
const { startScoreIdSync } = require("./services/matchScore.service");

// const {
//   processFancyResults,
// } = require("./services/fancyResult.service");

const app = express();

//

const corsOptions = {
  origin: ["http://localhost:4200", "http://localhost:4800"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

startMatchScheduler();
startPremiumScheduler();
startScoreIdSync();

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Premium Score API is running",
  });
});

app.use("/api/v1", routes);

module.exports = app;
