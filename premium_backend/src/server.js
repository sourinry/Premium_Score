// require("dotenv").config();

// const app = require("./app");
// const connectDB = require("./config/db");

// const PORT = process.env.PORT || 4000;

// const startServer = async () => {
//   await connectDB();
  

//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// };

// startServer();
require("dotenv").config();

console.log("=================================");
console.log("🔥 SERVER FILE:", __filename);
console.log("🔥 APP FILE:", require.resolve("./app"));
console.log("=================================");

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`🔥 SERVER RUNNING: http://127.0.0.1:${PORT}`);
  });
};

startServer();