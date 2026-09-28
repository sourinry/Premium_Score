const {
  processAllFancyResults,
} = require("../services/fancyResult.service");

let fancyResultRunning = false;

const runFancyResultScheduler = async () => {
  if (fancyResultRunning) {
    return;
  }

  fancyResultRunning = true;

  try {
    await processAllFancyResults();
  } catch (error) {
    console.error(
      "Fancy Result Sync Error:",
      error?.stack || error?.message || error
    );
  } finally {
    fancyResultRunning = false;
  }
};

const startFancyResultScheduler = () => {
    // 20 sec
  runFancyResultScheduler();
  setInterval(
    runFancyResultScheduler,
    20 * 1000
  );
};

module.exports = {
  startFancyResultScheduler,
};