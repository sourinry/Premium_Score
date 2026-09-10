const express = require("express");
const cors = require("cors");

const websiteRoutes = require("./routes/website.routes");

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Premium Score API is running",
  });
});

app.use("/api/websites", websiteRoutes);

module.exports = app;