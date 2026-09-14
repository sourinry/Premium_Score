
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`🔥SERVER RUNNING: http://127.0.0.1:${PORT}`);
  });
};

startServer();