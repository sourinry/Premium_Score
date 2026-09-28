const { processScoresFromRedis} = require("../services/matchScore.service");

let scoreSyncRunning = false;

const runScoreScheduler = async () => {
  if (scoreSyncRunning) {
    return;
  }

  scoreSyncRunning = true;

  try {

    await processScoresFromRedis();

  } catch (error) {
    console.error(
      "Score Sync Error:",
      error?.stack || error?.message || error
    );
  } finally {
    scoreSyncRunning = false;
  }
};

const startScoreScheduler = () => {
  // 10 sec
  runScoreScheduler();
  setInterval(
    runScoreScheduler,
    10 * 1000
  );
};

module.exports = {
  startScoreScheduler,
};