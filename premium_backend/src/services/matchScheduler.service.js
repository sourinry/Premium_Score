const axios = require("axios");
const cron = require("node-cron");

const Match = require("../models/matchModel");

const fetchMatches = async () => {
  try {
    const apiUrl = process.env.MAIN_REDIS_MATCHES_API;

    if (!apiUrl) {
      console.error("❌ MAIN_REDIS_MATCHES_API is not configured");
      return;
    }

    console.log(
      `🔄 Fetching matches: ${new Date().toISOString()}`
    );

    const response = await axios.get(apiUrl, {
      timeout: 30000,
    });

    console.log("✅ Matches API response received");

    // ---------------------------------------------
    // API response structure:
    // {
    //   message: "Match Fetched!",
    //   result: [...]
    // }
    // ---------------------------------------------

    const matches = Array.isArray(response.data?.result)
      ? response.data.result
      : [];

    console.log(`📦 Total matches received: ${matches.length}`);

    if (!matches.length) {
      console.log("⚠️ No matches found");
      return;
    }

    // ---------------------------------------------
    // Get event IDs
    // ---------------------------------------------

    const eventIds = matches
      .map((dt) => dt.eventId)
      .filter(Boolean);

    // ---------------------------------------------
    // Find existing matches
    // ---------------------------------------------

    const existingMatches = await Match.find(
      {
        eventId: { $in: eventIds },
      },
      {
        eventId: 1,
      }
    ).lean();

    const existingEventIds = new Set(
      existingMatches.map((dt) => String(dt.eventId))
    );

    // ---------------------------------------------
    // New matches
    // ---------------------------------------------

    const notExistsMatch = matches.filter(
      (dt) => !existingEventIds.has(String(dt.eventId))
    );

    console.log(
      `🆕 New matches found: ${notExistsMatch.length}`
    );

    // ---------------------------------------------
    // Same mapping as your existing code
    // ---------------------------------------------

    const addNewMatch = notExistsMatch.map((dt) => {
      return {
        eventId: dt.eventId,
        marketId: dt.marketId,
        eventName: dt.eventName,
        competitionName: dt.competitionName,
        competitionId: dt.competitionId,
        sportId: dt.sportId,
        sportName: dt.sportName,
        openDate: dt.openDate,

        isResult: false,

        scoreId: dt.scoreId,
        scoreType: dt.scoreType,

        matchType:
          dt.sportId == 4 &&
          Array.isArray(dt.matchRunners) &&
          dt.matchRunners.length == 3
            ? "Test"
            : "All",

        inning_info: dt.inning_info,
        matchRuners: dt.matchRunners,
        match_ka_type: dt.match_ka_type,
      };
    });

    // ---------------------------------------------
    // Insert new matches
    // ---------------------------------------------

    if (addNewMatch.length > 0) {
      const insertedMatches = await Match.insertMany(
        addNewMatch,
        {
          ordered: false,
        }
      );

      console.log(
        `✅ ${insertedMatches.length} new matches inserted`
      );
    } else {
      console.log("ℹ️ No new matches to insert");
    }

    // ---------------------------------------------
    // Update existing matches
    // ---------------------------------------------

    const updateOperations = matches
      .filter((dt) => existingEventIds.has(String(dt.eventId)))
      .map((dt) => ({
        updateOne: {
          filter: {
            eventId: dt.eventId,
          },
          update: {
            $set: {
              marketId: dt.marketId,
              eventName: dt.eventName,
              competitionName: dt.competitionName,
              competitionId: dt.competitionId,
              sportId: dt.sportId,
              sportName: dt.sportName,
              openDate: dt.openDate,

              scoreId: dt.scoreId,
              scoreType: dt.scoreType,

              matchType:
                dt.sportId == 4 &&
                Array.isArray(dt.matchRunners) &&
                dt.matchRunners.length == 3
                  ? "Test"
                  : "All",

              inning_info: dt.inning_info,
              matchRuners: dt.matchRunners,
              match_ka_type: dt.match_ka_type,
            },
          },
        },
      }));

    if (updateOperations.length > 0) {
      const updateResult = await Match.bulkWrite(
        updateOperations
      );

      console.log(
        `🔄 Existing matches updated: ${updateResult.modifiedCount}`
      );
    }

    console.log("✅ Match sync completed successfully");

  } catch (error) {
    console.error(
      "❌ Match scheduler failed:",
      error.message
    );

    if (error.response) {
      console.error(
        "HTTP Status:",
        error.response.status
      );

      console.error(
        "API Error Response:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    }
  }
};

const startMatchScheduler = () => {
  const apiUrl = process.env.MAIN_REDIS_MATCHES_API;

  if (!apiUrl) {
    console.error(
      "❌ MAIN_REDIS_MATCHES_API is not configured"
    );
    return;
  }

  // Run once immediately
  fetchMatches();

  // Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("⏰ 10 minute scheduler triggered");
    await fetchMatches();
  });

  console.log("✅ Match scheduler started");
  console.log("⏰ Match API will run every 10 minutes");
};

module.exports = {
  startMatchScheduler,
  fetchMatches,
};