
const express = require("express");
const cors = require("cors");
const routes = require("./routes/index.route");
const { startAllSchedulers} = require("./schedular/index");
const app = express();

const corsOptions = {
  origin: [
    "http://localhost:4200",
    "http://localhost:4800",
  ],
  methods: ["GET", "POST","PUT", "DELETE", "PATCH", "OPTIONS" ],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

startAllSchedulers();

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Premium Score API is running",
  });
});

app.use("/api/v1", routes);

module.exports = app;
