const axios = require("axios");
const cron = require("node-cron");

const Match = require("../models/matchModel");

// =====================================================
// SPORTS
// =====================================================

const SPORT_IDS = [4, 1, 2];

// 4 = Cricket
// 1 = Tennis
// 2 = Soccer


// =====================================================
// GET TEAM NAME
// =====================================================

const getTeamName = (runner) => {
  if (!runner) {
    return null;
  }

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

  // -----------------------------------------------------
  // First try matchRunners
  // -----------------------------------------------------

  if (
    Array.isArray(matchRunners) &&
    matchRunners.length >= 2
  ) {
    homeTeam = getTeamName(matchRunners[0]);
    awayTeam = getTeamName(matchRunners[1]);
  }

  // -----------------------------------------------------
  // Fallback eventName
  // -----------------------------------------------------

  if (
    (!homeTeam || !awayTeam) &&
    eventName
  ) {
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
            awayTeam = parts
              .slice(1)
              .join(separator)
              .trim();
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
    Number(match.sportId) === 4 &&
    Array.isArray(match.matchRunners) &&
    match.matchRunners.length === 3
  ) {
    return "Test";
  }

  return "All";
};


// =====================================================
// FETCH MATCHES FOR ONE SPORT
// =====================================================

const fetchMatchesBySport = async (sportId) => {
  try {
    const apiUrl =
      process.env.MAIN_REDIS_MATCHES_API;

    if (!apiUrl) {
      console.error(
        "❌ MAIN_REDIS_MATCHES_API is not configured"
      );

      return;
    }

    console.log(
      `\n🔄 Fetching matches for sportId=${sportId}`
    );

    // =================================================
    // CREATE URL
    // =================================================

    const url = new URL(apiUrl);

    url.searchParams.set(
      "sportId",
      String(sportId)
    );

    console.log(
      `🌐 API URL: ${url.toString()}`
    );

    // =================================================
    // API CALL
    // =================================================

    const response = await axios.get(
      url.toString(),
      {
        timeout: 30000,
      }
    );

    // =================================================
    // GET MATCH ARRAY
    // =================================================

    const matches = Array.isArray(
      response.data?.result
    )
      ? response.data.result
      : [];

    console.log(
      `📦 sportId=${sportId} matches received: ${matches.length}`
    );

    // =================================================
    // SAFETY
    // =================================================

    if (!matches.length) {
      console.log(
        `⚠️ No matches found for sportId=${sportId}`
      );

      return;
    }

    // =================================================
    // VALID MATCHES
    // =================================================

    const validMatches = matches.filter(
      (dt) =>
        dt &&
        dt.eventId !== undefined &&
        dt.eventId !== null &&
        String(dt.eventId).trim() !== ""
    );

    const eventIds = validMatches.map(
      (dt) =>
        String(dt.eventId).trim()
    );

    console.log(
      `🔎 sportId=${sportId} valid event IDs: ${eventIds.length}`
    );

    if (!eventIds.length) {
      console.log(
        `⚠️ No valid event IDs for sportId=${sportId}`
      );

      return;
    }

    // =================================================
    // FIND EXISTING MATCHES
    // =================================================

    const existingMatches =
      await Match.find(
        {
          eventId: {
            $in: eventIds,
          },

          sportId: sportId,
        },
        {
          eventId: 1,
          sportId: 1,
        }
      ).lean();

    const existingEventIds =
      new Set(
        existingMatches.map(
          (dt) =>
            String(dt.eventId)
        )
      );

    console.log(
      `📌 sportId=${sportId} existing matches: ${existingEventIds.size}`
    );

    // =================================================
    // RESTORE OLD MATCHES
    // =================================================

    const activeResult =
      await Match.updateMany(
        {
          eventId: {
            $in: eventIds,
          },

          sportId: sportId,

          isOld: true,
        },
        {
          $set: {
            isOld: false,
          },
        }
      );

    if (
      activeResult.modifiedCount > 0
    ) {
      console.log(
        `🟢 sportId=${sportId} restored old matches: ${activeResult.modifiedCount}`
      );
    }

    // =================================================
    // MARK MISSING MATCHES AS OLD
    // ONLY FOR THIS SPORT
    // =================================================

    const oldResult =
      await Match.updateMany(
        {
          sportId: sportId,

          eventId: {
            $nin: eventIds,
          },

          isOld: false,
        },
        {
          $set: {
            isOld: true,
          },
        }
      );

    if (
      oldResult.modifiedCount > 0
    ) {
      console.log(
        `📦 sportId=${sportId} marked old: ${oldResult.modifiedCount}`
      );
    }

    // =================================================
    // NEW MATCHES
    // =================================================

    const newMatches =
      validMatches.filter(
        (dt) =>
          !existingEventIds.has(
            String(dt.eventId).trim()
          )
      );

    console.log(
      `🆕 sportId=${sportId} new matches: ${newMatches.length}`
    );

    // =================================================
    // PREPARE NEW MATCHES
    // EXACTLY ACCORDING TO YOUR SCHEMA
    // =================================================

    const addNewMatch =
      newMatches.map((dt) => {
        const {
          homeTeam,
          awayTeam,
        } = getHomeAwayTeams(
          dt.matchRunners,
          dt.eventName
        );

        return {
          eventId:
            String(dt.eventId).trim(),

          marketId:
            dt.marketId || null,

          eventName:
            dt.eventName || null,

          competitionName:
            dt.competitionName || null,

          competitionId:
            dt.competitionId !== undefined &&
            dt.competitionId !== null
              ? String(dt.competitionId)
              : null,

          // IMPORTANT
          sportId:
            dt.sportId !== undefined &&
            dt.sportId !== null
              ? Number(dt.sportId)
              : sportId,

          sportName:
            dt.sportName || null,

          openDate:
            dt.openDate || null,

          isResult:
            Boolean(dt.isResult),

          scoreId:
            dt.scoreId || null,

          scoreType:
            dt.scoreType || null,

          matchType:
            getMatchType(dt),

          isOld: false,

          homeTeam,

          awayTeam,

          inning_info:
            dt.inning_info || null,

          matchRuners:
            Array.isArray(dt.matchRunners)
              ? dt.matchRunners
              : [],

          match_ka_type:
            dt.match_ka_type || null,
        };
      });

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
          `✅ sportId=${sportId}: ${insertedMatches.length} matches inserted`
        );
      } catch (insertError) {
        console.error(
          `❌ sportId=${sportId} insert error:`,
          insertError.message
        );
      }
    } else {
      console.log(
        `ℹ️ sportId=${sportId}: no new matches to insert`
      );
    }

    // =================================================
    // UPDATE EXISTING MATCHES
    // =================================================

    const updateOperations =
      validMatches
        .filter((dt) =>
          existingEventIds.has(
            String(dt.eventId).trim()
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
                eventId:
                  String(dt.eventId).trim(),

                sportId:
                  sportId,
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
                    dt.competitionId !== undefined &&
                    dt.competitionId !== null
                      ? String(
                          dt.competitionId
                        )
                      : null,

                  sportId:
                    dt.sportId !== undefined &&
                    dt.sportId !== null
                      ? Number(dt.sportId)
                      : sportId,

                  sportName:
                    dt.sportName || null,

                  openDate:
                    dt.openDate || null,

                  isResult:
                    Boolean(dt.isResult),

                  scoreId:
                    dt.scoreId || null,

                  scoreType:
                    dt.scoreType || null,

                  matchType:
                    getMatchType(dt),

                  isOld: false,

                  homeTeam,

                  awayTeam,

                  inning_info:
                    dt.inning_info || null,

                  matchRuners:
                    Array.isArray(
                      dt.matchRunners
                    )
                      ? dt.matchRunners
                      : [],

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
          updateOperations,
          {
            ordered: false,
          }
        );

      console.log(
        `🔄 sportId=${sportId}: ${updateResult.modifiedCount} matches updated`
      );
    } else {
      console.log(
        `ℹ️ sportId=${sportId}: no existing matches to update`
      );
    }

    console.log(
      `✅ sportId=${sportId} sync completed`
    );

  } catch (error) {
    console.error(
      `❌ sportId=${sportId} scheduler failed:`,
      error.message
    );

    if (error.response) {
      console.error(
        "HTTP Status:",
        error.response.status
      );

      console.error(
        "API Error:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    }

    if (
      error.code === "ECONNABORTED"
    ) {
      console.error(
        `⏰ sportId=${sportId} API request timed out`
      );
    }

    if (
      error.code === "ECONNREFUSED"
    ) {
      console.error(
        `🔌 sportId=${sportId} API connection refused`
      );
    }
  }
};


// =====================================================
// FETCH ALL 3 SPORTS
// =====================================================

const fetchMatches = async () => {
  console.log(
    "\n=========================================="
  );

  console.log(
    "🚀 STARTING ALL SPORTS MATCH SYNC"
  );

  console.log(
    "=========================================="
  );

  // 4 = Cricket
  // 1 = Tennis
  // 2 = Soccer

  for (const sportId of SPORT_IDS) {
    await fetchMatchesBySport(sportId);
  }

  console.log(
    "\n=========================================="
  );

  console.log(
    "✅ ALL SPORTS MATCH SYNC COMPLETED"
  );

  console.log(
    "==========================================\n"
  );
};


// =====================================================
// START SCHEDULER
// =====================================================

const startMatchScheduler = () => {
  const apiUrl =
    process.env.MAIN_REDIS_MATCHES_API;

  if (!apiUrl) {
    console.error(
      "❌ MAIN_REDIS_MATCHES_API is not configured"
    );

    return;
  }

  // =================================================
  // INITIAL FETCH
  // =================================================

  console.log(
    "🚀 Running initial match sync..."
  );

  fetchMatches();

  // =================================================
  // EVERY 10 MINUTES
  // =================================================

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
// EXPORT
// =====================================================

module.exports = {
  startMatchScheduler,
  fetchMatches,
  fetchMatchesBySport,
};