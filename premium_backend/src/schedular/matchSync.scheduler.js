const {fetchMatches} = require("../services/matchScheduler.service");
const {saveMatchesToRedis} = require("../services/matchRedis.service");

let matchSyncRunning = false;

const runMatchSyncScheduler = async () => {
  if (matchSyncRunning) {
    return;
  }

  matchSyncRunning = true;

  try {

    await fetchMatches();
    await saveMatchesToRedis();
    console.log("✅ Match Sync completed");
  } catch (error) {
    console.error(
      "Match Sync Error:",
      error?.stack || error?.message || error
    );
  } finally {
    matchSyncRunning = false;
  }
};

const startMatchSyncScheduler = () => {
  console.log(
    "Match Sync Scheduler Started - Every 10 minutes"
  );

  runMatchSyncScheduler();
  // Run every 10 minutes
  setInterval(
    runMatchSyncScheduler,
    10 * 60 * 1000
  );
};

module.exports = {
  startMatchSyncScheduler,
};