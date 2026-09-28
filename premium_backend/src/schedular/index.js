const { startMatchSyncScheduler } = require("./matchSync.scheduler");
const { startScoreIdScheduler } = require("./scoreId.scheduler");
const { startScoreScheduler } = require("./score.scheduler");
const { startFancyScheduler } = require("./fancy.scheduler");
const { startFancyResultScheduler } = require("./fancyResult.scheduler");

const startAllSchedulers = () => {
  startMatchSyncScheduler();
  startScoreIdScheduler();
  startScoreScheduler();
  startFancyScheduler();
  startFancyResultScheduler();
  console.log("✅ All schedulers started");
};

module.exports = {
  startAllSchedulers,
};
