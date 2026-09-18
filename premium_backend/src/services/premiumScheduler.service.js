const cron = require("node-cron");

const { saveMatchesToRedis } = require("./matchRedis.service");

const { processScoresFromRedis } = require("./matchScore.service");
const {processAllCompletedFancyResults } = require("./fancyResult.service");
const { processFancyFromRedis } = require("./fancy.service");



// COMPLETE PREMIUM SYNC

const runPremiumSync = async () => {
  try {
    await saveMatchesToRedis();
    await processScoresFromRedis();
    await processAllCompletedFancyResults();
    await processFancyFromRedis();
    
  } catch (error) {
  }
};

       
       
const startPremiumScheduler = () => {
  runPremiumSync();
  // EVERY 10 MINUTES
        
  cron.schedule("*/10 * * * *", async () => {
    console.log("Premium scheduler triggered");
    await runPremiumSync();
  });

};

module.exports = {
  startPremiumScheduler,
  runPremiumSync,
};
