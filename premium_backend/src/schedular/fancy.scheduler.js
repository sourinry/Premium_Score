const {
  processFancyFromRedis,
} = require("../services/fancy.service");

let fancySyncRunning = false;

const runFancyScheduler = async () => {
  if (fancySyncRunning) {
    return;
  }

  fancySyncRunning = true;

  try {

    await processFancyFromRedis();

  } catch (error) {
    console.error(
      "Fancy Add Sync Error:",
      error?.stack || error?.message || error
    );
  } finally {
    fancySyncRunning = false;
  }
};

const startFancyScheduler = () => {
  // 20 sec
  runFancyScheduler();
  setInterval(
    runFancyScheduler,
    20 * 1000
  );
};

module.exports = {
  startFancyScheduler,
};