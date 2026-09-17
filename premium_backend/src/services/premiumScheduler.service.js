const cron = require("node-cron");

const {
  saveMatchesToRedis,
} = require("./matchRedis.service");

const {
  processScoresFromRedis,
} = require("./matchScore.service");

const {
  processFancyFromRedis,
} = require("./fancy.service");

const {
  processFancyResults,
} = require("./fancyResult.service");

const {
  processSingleMatchResult,
} = require("./fancyResult.service");

// COMPLETE PREMIUM SYNC

const runPremiumSync = async () => {
  try {

    await saveMatchesToRedis();


    // Redis → Score API → MongoDB
    // =================================================

    console.log(
      "\n2️⃣ Redis → Score API → MongoDB"
    );

    await processScoresFromRedis();
    processSingleMatchResult("-11209499");

    //  await processFancyResults();


    // =================================================
    // STEP 3
    // Redis → Fancy API → MongoDB
    // =================================================

    console.log(
      "\n3️⃣ Redis → Fancy API → MongoDB"
    );

    await processFancyFromRedis();


    console.log(
      "\n=============================================="
    );

    console.log(
      "✅ PREMIUM SCHEDULER COMPLETED"
    );

    console.log(
      "==============================================\n"
    );

  } catch (error) {
    console.error(
      "❌ Premium scheduler error:",
      error.message
    );
  }
};


// =====================================================
// START SCHEDULER
// =====================================================

const startPremiumScheduler = () => {
  console.log(
    "🚀 Starting premium scheduler..."
  );

  // -------------------------------------------------
  // RUN ON SERVER START
  // -------------------------------------------------

  runPremiumSync();


  // -------------------------------------------------
  // EVERY 10 MINUTES
  // -------------------------------------------------

  cron.schedule(
    "*/10 * * * *",
    async () => {
      console.log(
        "⏰ Premium scheduler triggered"
      );

      await runPremiumSync();
    }
  );

  console.log(
    "✅ Premium scheduler started"
  );

  console.log(
    "⏰ Premium sync will run every 10 minutes"
  );
};


module.exports = {
  startPremiumScheduler,
  runPremiumSync,
};