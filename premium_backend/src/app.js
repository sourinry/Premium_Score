const express = require("express");
const cors = require("cors");

const routes = require("./routes/index.route");

const {
  startMatchScheduler,
} = require("./services/matchScheduler.service");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

startMatchScheduler();


app.get("/", (req, res) => {
  console.log("🔥 ROOT HIT");

  res.json({
    success: true,
    message: "Premium Score API is running",
  });
});




app.use("/api/v1", routes);

// ================================
// 404
// ================================

app.use((req, res) => {
  console.log("❌ UNMATCHED:", req.method, req.originalUrl);

  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

module.exports = app;