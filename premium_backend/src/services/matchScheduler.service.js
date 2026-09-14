const axios = require("axios");
const cron = require("node-cron");

const Match = require("../models/matchModel");

// =====================================================
// GET TEAM NAME FROM RUNNER
// =====================================================

const getTeamName = (runner) => {
  if (!runner) {
    return null;
  }

  // Direct string
  if (typeof runner === "string") {
    return runner.trim() || null;
  }

  return (
    runner.name ||
    runner.runnerName ||
    runner.teamName ||
    runner.selectionName ||
    runner.runner?.name ||
    runner.runner?.runnerName ||
    runner.selection?.name ||
    null
  );
};

// =====================================================
// GET HOME / AWAY TEAM
// =====================================================

const getHomeAwayTeams = (matchRunners, eventName) => {
  let homeTeam = null;
  let awayTeam = null;

  // ---------------------------------------------------
  // First try matchRunners
  // ---------------------------------------------------

  if (Array.isArray(matchRunners) && matchRunners.length >= 2) {
    homeTeam = getTeamName(matchRunners[0]);
    awayTeam = getTeamName(matchRunners[1]);
  }

  // ---------------------------------------------------
  // Fallback from eventName
  //
  // Example:
  // Namibia v South Africa
  // England U19 v Pakistan U19
  // ---------------------------------------------------

  if ((!homeTeam || !awayTeam) && eventName) {
    const name = String(eventName).trim();

    const separators = [
      " v ",
      " V ",
      " vs ",
      " VS ",
      " - ",
    ];

    for (const separator of separators) {
      if (name.includes(separator)) {
        const parts = name.split(separator);

        if (parts.length >= 2) {
          if (!homeTeam) {
            homeTeam = parts[0].trim();
          }

          if (!awayTeam) {
            awayTeam = parts.slice(1).join(separator).trim();
          }

          break;
        }
      }
    }
  }

  return {
    homeTeam: homeTeam || null,
    awayTeam: awayTeam || null,
  };
};

// =====================================================
// GET MATCH TYPE
// =====================================================

const getMatchType = (match) => {
  if (
    match.sportId == 4 &&
    Array.isArray(match.matchRunners) &&
    match.matchRunners.length == 3
  ) {
    return "Test";
  }

  return "All";
};

// =====================================================
// FETCH MATCHES
// =====================================================

const fetchMatches = async () => {
  try {
    const apiUrl = process.env.MAIN_REDIS_MATCHES_API;

    // -------------------------------------------------
    // API URL CHECK
    // -------------------------------------------------

    if (!apiUrl) {
      console.error(
        "❌ MAIN_REDIS_MATCHES_API is not configured"
      );

      return;
    }

    console.log(
      `🔄 Fetching matches: ${new Date().toISOString()}`
    );

    // -------------------------------------------------
    // CALL MAIN MATCH API
    // -------------------------------------------------

    const response = await axios.get(apiUrl, {
      timeout: 30000,
    });

    console.log(
      "✅ Matches API response received"
    );

    // -------------------------------------------------
    // API RESPONSE
    //
    // {
    //   message: "Match Fetched!",
    //   result: [...]
    // }
    // -------------------------------------------------

    const matches = Array.isArray(
      response.data?.result
    )
      ? response.data.result
      : [];

    console.log(
      `📦 Total matches received: ${matches.length}`
    );

    // -------------------------------------------------
    // NO MATCHES
    // -------------------------------------------------

    if (!matches.length) {
      console.log("⚠️ No matches found");

      return;
    }

    // =================================================
    // EVENT IDS
    // =================================================

    const eventIds = matches
      .map((dt) => dt.eventId)
      .filter(Boolean);

    console.log(
      `🔎 Valid event IDs: ${eventIds.length}`
    );

    if (!eventIds.length) {
      console.log(
        "⚠️ No valid event IDs found"
      );

      return;
    }

    // =================================================
    // FIND EXISTING MATCHES
    // =================================================

    const existingMatches = await Match.find(
      {
        eventId: {
          $in: eventIds,
        },
      },
      {
        eventId: 1,
      }
    ).lean();

    const existingEventIds = new Set(
      existingMatches.map((dt) =>
        String(dt.eventId)
      )
    );

    console.log(
      `📌 Existing matches: ${existingEventIds.size}`
    );

    // =================================================
    // NEW MATCHES
    // =================================================

    const notExistsMatch = matches.filter(
      (dt) =>
        dt.eventId &&
        !existingEventIds.has(
          String(dt.eventId)
        )
    );

    console.log(
      `🆕 New matches found: ${notExistsMatch.length}`
    );

    // =================================================
    // PREPARE NEW MATCHES
    // =================================================

    const addNewMatch = notExistsMatch.map(
      (dt) => {
        const {
          homeTeam,
          awayTeam,
        } = getHomeAwayTeams(
          dt.matchRunners,
          dt.eventName
        );

        return {
          eventId: dt.eventId,

          marketId:
            dt.marketId || null,

          eventName:
            dt.eventName || null,

          competitionName:
            dt.competitionName || null,

          competitionId:
            dt.competitionId || null,

          sportId:
            dt.sportId ?? null,

          sportName:
            dt.sportName || null,

          openDate:
            dt.openDate || null,

          isResult: false,

          scoreId:
            dt.scoreId || null,

          scoreType:
            dt.scoreType || null,

          matchType:
            getMatchType(dt),

          // -------------------------------
          // HOME / AWAY
          // -------------------------------

          homeTeam,

          awayTeam,

          // -------------------------------
          // OTHER DATA
          // -------------------------------

          inning_info:
            dt.inning_info || null,

          matchRuners:
            dt.matchRunners || [],

          match_ka_type:
            dt.match_ka_type || null,
        };
      }
    );

    // =================================================
    // INSERT NEW MATCHES
    // =================================================

    if (addNewMatch.length > 0) {
      try {
        const insertedMatches =
          await Match.insertMany(
            addNewMatch,
            {
              ordered: false,
            }
          );

        console.log(
          `✅ ${insertedMatches.length} new matches inserted`
        );
      } catch (insertError) {
        console.error(
          "❌ Error inserting new matches:",
          insertError.message
        );
      }
    } else {
      console.log(
        "ℹ️ No new matches to insert"
      );
    }

    // =================================================
    // UPDATE EXISTING MATCHES
    // =================================================

    const updateOperations = matches
      .filter(
        (dt) =>
          dt.eventId &&
          existingEventIds.has(
            String(dt.eventId)
          )
      )
      .map((dt) => {
        const {
          homeTeam,
          awayTeam,
        } = getHomeAwayTeams(
          dt.matchRunners,
          dt.eventName
        );

        return {
          updateOne: {
            filter: {
              eventId: dt.eventId,
            },

            update: {
              $set: {
                marketId:
                  dt.marketId || null,

                eventName:
                  dt.eventName || null,

                competitionName:
                  dt.competitionName || null,

                competitionId:
                  dt.competitionId || null,

                sportId:
                  dt.sportId ?? null,

                sportName:
                  dt.sportName || null,

                openDate:
                  dt.openDate || null,

                scoreId:
                  dt.scoreId || null,

                scoreType:
                  dt.scoreType || null,

                matchType:
                  getMatchType(dt),

                // -----------------------------
                // HOME / AWAY
                // -----------------------------

                homeTeam,

                awayTeam,

                // -----------------------------
                // OTHER DATA
                // -----------------------------

                inning_info:
                  dt.inning_info || null,

                matchRuners:
                  dt.matchRunners || [],

                match_ka_type:
                  dt.match_ka_type || null,
              },
            },
          },
        };
      });

    // =================================================
    // BULK UPDATE
    // =================================================

    if (updateOperations.length > 0) {
      const updateResult =
        await Match.bulkWrite(
          updateOperations
        );

      console.log(
        `🔄 Existing matches updated: ${updateResult.modifiedCount}`
      );
    } else {
      console.log(
        "ℹ️ No existing matches to update"
      );
    }

    // =================================================
    // FINAL LOG
    // =================================================

    console.log(
      "=========================================="
    );

    console.log(
      "✅ Match sync completed successfully"
    );

    console.log(
      "=========================================="
    );
  } catch (error) {
    // =================================================
    // MAIN ERROR
    // =================================================

    console.error(
      "❌ Match scheduler failed:",
      error.message
    );

    // =================================================
    // AXIOS ERROR
    // =================================================

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

    // =================================================
    // TIMEOUT
    // =================================================

    if (error.code === "ECONNABORTED") {
      console.error(
        "⏰ Match API request timed out"
      );
    }

    // =================================================
    // CONNECTION ERROR
    // =================================================

    if (
      error.code === "ECONNREFUSED"
    ) {
      console.error(
        "🔌 Match API connection refused"
      );
    }
  }
};

// =====================================================
// START MATCH SCHEDULER
// =====================================================

const startMatchScheduler = () => {
  const apiUrl =
    process.env.MAIN_REDIS_MATCHES_API;

  // ---------------------------------------------------
  // API URL CHECK
  // ---------------------------------------------------

  if (!apiUrl) {
    console.error(
      "❌ MAIN_REDIS_MATCHES_API is not configured"
    );

    return;
  }

  // ---------------------------------------------------
  // RUN ON SERVER START
  // ---------------------------------------------------

  console.log(
    "🚀 Running initial match sync..."
  );

  fetchMatches();

  // ---------------------------------------------------
  // RUN EVERY 10 MINUTES
  // ---------------------------------------------------

  cron.schedule(
    "*/10 * * * *",
    async () => {
      console.log(
        "⏰ 10 minute scheduler triggered"
      );

      await fetchMatches();
    }
  );

  console.log(
    "✅ Match scheduler started"
  );

  console.log(
    "⏰ Match API will run every 10 minutes"
  );
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  startMatchScheduler,
  fetchMatches,
};