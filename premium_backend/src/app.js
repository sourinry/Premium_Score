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
  res.json({
    success: true,
    message: "Premium Score API is running",
  });
});

app.use("/api/v1", routes);

module.exports = app;