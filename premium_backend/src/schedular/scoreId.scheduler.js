const { runScoreIdSync} = require("../services/matchScore.service");

const startScoreIdScheduler = () => {
// 30 sec
  runScoreIdSync();
  setInterval(
    runScoreIdSync,
    30 * 1000
  );
};

module.exports = {
  startScoreIdScheduler,
};