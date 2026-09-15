const axios = require("axios");

const Match = require("../models/matchModel");

const {
  getMatchesFromRedis,
} = require("./matchRedis.service");

const redisClient = require("../config/redis");

// =====================================================
// APIs
// =====================================================

const GET_ALL_SCORE_ID_API =
  "http://3.6.53.212:3000/api/match/getAllScoreId";

const GET_SCORE_API =
  "http://3.6.53.212:3000/api/match/getScore";

// =====================================================
// REDIS SCORE KEY
// =====================================================

const getScoreRedisKey = (eventId, sportId) => {
  return `score:eventId:${eventId}:sportId:${sportId}`;
};

// =====================================================
// SCORE API CONCURRENCY
// =====================================================

// Ek time par itni hi getScore APIs chalengi.
const SCORE_CONCURRENCY = 5;

// Supported sports
const SUPPORTED_SPORT_IDS = [1, 2, 4];

// =====================================================
// STEP 1
// GET ALL SCORE IDS
// =====================================================

const getAllScoreIds = async () => {
  try {
    console.log("\n==============================================");
    console.log("1️⃣ GETTING ALL SCORE IDS");
    console.log("==============================================");

    const response = await axios.get(
      GET_ALL_SCORE_ID_API,
      {
        timeout: 30000,

        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = response?.data?.result;

    if (!Array.isArray(result)) {
      console.log(
        "⚠️ getAllScoreId result is not an array"
      );

      return new Map();
    }

    console.log(
      `📦 Total scoreIds received: ${result.length}`
    );

    const scoreIdMap = new Map();

    for (const item of result) {
      const eventId = String(
        item?.eventId || ""
      ).trim();

      const scoreId = String(
        item?.scoreId || ""
      ).trim();

      // Invalid data skip
      if (
        !eventId ||
        !scoreId ||
        scoreId === "0"
      ) {
        continue;
      }

      scoreIdMap.set(
        eventId,
        scoreId
      );
    }

    console.log(
      `✅ Valid scoreId mappings: ${scoreIdMap.size}`
    );

    return scoreIdMap;

  } catch (error) {

    if (error.response) {

      console.error(
        "❌ getAllScoreId API failed"
      );

      console.error(
        "HTTP Status:",
        error.response.status
      );

      console.error(
        "Response:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );

      return new Map();
    }

    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {

      console.error(
        "⏰ getAllScoreId API timeout"
      );

      return new Map();
    }

    console.error(
      "❌ getAllScoreId error:",
      error.message
    );

    return new Map();
  }
};

// =====================================================
// STEP 2
// UPDATE DB MATCHES HAVING scoreId = "0"
// =====================================================

const updateMissingScoreIds = async (
  matches,
  scoreIdMap
) => {

  let updatedCount = 0;
  let alreadyExistsCount = 0;
  let notFoundCount = 0;

  console.log(
    "\n=============================================="
  );

  console.log(
    "2️⃣ UPDATING SCORE IDS IN MONGODB"
  );

  console.log(
    "=============================================="
  );

  // ===================================================
  // GET ONLY DB MATCHES WHERE SCORE ID IS 0
  // ===================================================

  const dbMatches = await Match.find({
    sportId: {
      $in: SUPPORTED_SPORT_IDS,
    },

    scoreId: "0",

    isOld: false,
  }).lean();

  console.log(
    `📦 DB matches having scoreId=0: ${dbMatches.length}`
  );

  // ===================================================
  // LOOP DB MATCHES
  // ===================================================

  for (const dbMatch of dbMatches) {

    const eventId = String(
      dbMatch?.eventId || ""
    ).trim();

    const sportId = Number(
      dbMatch?.sportId
    );

    if (
      !eventId ||
      !SUPPORTED_SPORT_IDS.includes(sportId)
    ) {
      continue;
    }

    // =================================================
    // FIND SCORE ID FROM API RESPONSE
    // =================================================

    const scoreId = scoreIdMap.get(
      eventId
    );

    // =================================================
    // API ME SCORE ID NAHI MILI
    // =================================================

    if (!scoreId) {

      notFoundCount++;

      console.log(
        `⚠️ scoreId not found | eventId=${eventId} | sportId=${sportId}`
      );

      continue;
    }

    // =================================================
    // UPDATE MONGODB
    // =================================================

    const updateResult =
      await Match.updateOne(
        {
          _id: dbMatch._id,

          // Safety:
          // sirf wahi update karo jiska scoreId abhi 0 hai
          scoreId: "0",
        },
        {
          $set: {
            scoreId: String(scoreId),
          },
        }
      );

    // =================================================
    // UPDATE SUCCESS
    // =================================================

    if (
      updateResult.matchedCount > 0 &&
      updateResult.modifiedCount > 0
    ) {

      updatedCount++;

      console.log(
        `✅ scoreId updated | eventId=${eventId} | sportId=${sportId} | 0 → ${scoreId}`
      );

      // =================================================
      // IMPORTANT
      // Redis ke current match object ko bhi update karo
      // =================================================

      const redisMatch = matches.find(
        (match) =>
          String(match?.eventId || "").trim() ===
            eventId &&
          Number(match?.sportId) ===
            sportId
      );

      if (redisMatch) {

        redisMatch.scoreId =
          String(scoreId);

        console.log(
          `🔄 Redis match scoreId updated | eventId=${eventId} | scoreId=${scoreId}`
        );
      }

    } else if (
      updateResult.matchedCount > 0 &&
      updateResult.modifiedCount === 0
    ) {

      alreadyExistsCount++;

      console.log(
        `ℹ️ scoreId already updated by another process | eventId=${eventId} | sportId=${sportId}`
      );

    } else {

      console.log(
        `⚠️ DB update failed | eventId=${eventId} | sportId=${sportId}`
      );
    }
  }

  // ===================================================
  // SUMMARY
  // ===================================================

  console.log(
    "\n📊 SCORE ID SUMMARY"
  );

  console.log(
    `✅ Newly updated: ${updatedCount}`
  );

  console.log(
    `ℹ️ Already exists/updated: ${alreadyExistsCount}`
  );

  console.log(
    `⚠️ Not available from API: ${notFoundCount}`
  );

  return {
    updatedCount,
    alreadyExistsCount,
    notFoundCount,
  };
};

// =====================================================
// STEP 3
// GET ACTUAL SCORE FOR ONE MATCH
// =====================================================

const fetchActualScore = async (
  match
) => {

  try {

    const eventId = String(
      match?.eventId || ""
    ).trim();

    const sportId = Number(
      match?.sportId
    );

    const scoreId = String(
      match?.scoreId || ""
    ).trim();

    // =================================================
    // VALIDATION
    // =================================================

    if (!eventId) {

      console.log(
        "⚠️ Actual score skipped: eventId missing"
      );

      return null;
    }

    if (
      !SUPPORTED_SPORT_IDS.includes(
        sportId
      )
    ) {

      console.log(
        `⚠️ Actual score skipped: invalid sportId=${sportId}`
      );

      return null;
    }

    // =================================================
    // SCORE ID MUST EXIST
    // =================================================

    if (
      !scoreId ||
      scoreId === "0"
    ) {

      console.log(
        `⚠️ Actual score skipped: scoreId missing | eventId=${eventId} | sportId=${sportId}`
      );

      return null;
    }

    // =================================================
    // GET SCORE API
    // =================================================

    const url =
      `${GET_SCORE_API}/${eventId}/${sportId}`;

    console.log(
      `🎯 GET SCORE | eventId=${eventId} | sportId=${sportId} | scoreId=${scoreId}`
    );

    const scoreGet =
      await axios.get(
        url,
        {
          timeout: 30000,

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

    const responseData =
      scoreGet?.data;

    // =================================================
    // EVENT NOT FOUND
    // =================================================

    const scoreMessage =
      responseData?.result
        ?.scorecard
        ?.message;

    if (
      scoreMessage ===
      "Event not found."
    ) {

      console.log(
        `⚠️ Event not found | eventId=${eventId} | sportId=${sportId}`
      );

      return null;
    }

    // =================================================
    // PREPARE SCORE RESPONSE
    // =================================================

    let resp;

    // =================================================
    // CRICKET
    // =================================================

    if (sportId === 4) {

      resp = {
        scorecard:
          responseData?.result
            ?.scorecard,

        timeline:
          responseData?.result
            ?.timeline,
      };
    }

    // =================================================
    // TENNIS
    // =================================================

    else if (sportId === 1) {

      resp = {
        result:
          responseData?.result ??
          null,
      };
    }

    // =================================================
    // SOCCER
    // =================================================

    else if (sportId === 2) {

      resp = {
        result:
          responseData?.result ??
          null,
      };
    }

    // =================================================
    // SAVE ACTUAL SCORE IN REDIS
    // =================================================

    const redisKey =
      getScoreRedisKey(
        eventId,
        sportId
      );

    const redisData = {

      eventId,

      sportId,

      scoreId,

      data: resp,

      updatedAt:
        new Date().toISOString(),
    };

    await redisClient.set(
      redisKey,
      JSON.stringify(
        redisData
      )
    );

    console.log(
      `✅ Actual score saved in Redis | key=${redisKey}`
    );

    return redisData;

  } catch (error) {

    // =================================================
    // HTTP ERROR
    // =================================================

    if (error.response) {

      console.error(
        `❌ getScore API failed | eventId=${match?.eventId} | sportId=${match?.sportId}`
      );

      console.error(
        "HTTP Status:",
        error.response.status
      );

      console.error(
        "Response:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );

      return null;
    }

    // =================================================
    // TIMEOUT
    // =================================================

    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {

      console.error(
        `⏰ getScore API timeout | eventId=${match?.eventId} | sportId=${match?.sportId}`
      );

      return null;
    }

    // =================================================
    // CONNECTION REFUSED
    // =================================================

    if (
      error.code === "ECONNREFUSED"
    ) {

      console.error(
        `🔌 getScore connection refused | eventId=${match?.eventId} | sportId=${match?.sportId}`
      );

      return null;
    }

    // =================================================
    // GENERAL ERROR
    // =================================================

    console.error(
      `❌ Actual score failed | eventId=${match?.eventId} | sportId=${match?.sportId}:`,
      error.message
    );

    return null;
  }
};

// =====================================================
// STEP 4
// PROCESS SCORE WITH LIMITED CONCURRENCY
// =====================================================

const processScoreWithConcurrency =
  async (matches) => {

    let successCount = 0;
    let failedCount = 0;

    // =================================================
    // ONLY MATCHES HAVING VALID SCORE ID
    // =================================================

    const validMatches =
      matches.filter(
        (match) => {

          const scoreId =
            String(
              match?.scoreId || ""
            ).trim();

          return (
            scoreId &&
            scoreId !== "0"
          );
        }
      );

    console.log(
      `📦 Matches eligible for getScore: ${validMatches.length}`
    );

    console.log(
      `🚦 getScore concurrency: ${SCORE_CONCURRENCY}`
    );

    // =================================================
    // PROCESS IN BATCHES
    // =================================================

    for (
      let i = 0;
      i < validMatches.length;
      i += SCORE_CONCURRENCY
    ) {

      const batch =
        validMatches.slice(
          i,
          i + SCORE_CONCURRENCY
        );

      console.log(
        `\n🔄 Processing score batch ${Math.floor(i / SCORE_CONCURRENCY) + 1}`
      );

      const results =
        await Promise.all(
          batch.map(
            (match) =>
              fetchActualScore(
                match
              )
          )
        );

      for (
        const result of results
      ) {

        if (result) {

          successCount++;

        } else {

          failedCount++;
        }
      }
    }

    return {
      successCount,
      failedCount,
    };
  };

// =====================================================
// PROCESS ALL MATCHES FROM REDIS
// =====================================================

const processScoresFromRedis =
  async () => {

    try {

      console.log("\n");

      console.log(
        "=============================================="
      );

      console.log(
        "🎯 SCORE SERVICE STARTED"
      );

      console.log(
        "=============================================="
      );

      // =================================================
      // GET MATCHES FROM REDIS
      // =================================================

      const matches =
        await getMatchesFromRedis();

      if (
        !Array.isArray(matches) ||
        matches.length === 0
      ) {

        console.log(
          "⚠️ No matches available in Redis"
        );

        return;
      }

      console.log(
        `📦 Matches from Redis: ${matches.length}`
      );

      // =================================================
      // STEP 1
      // getAllScoreId
      // ONLY ONE API CALL
      // =================================================

      const scoreIdMap =
        await getAllScoreIds();

      // =================================================
      // STEP 2
      // UPDATE DB scoreId = 0
      // =================================================

      await updateMissingScoreIds(
        matches,
        scoreIdMap
      );

      // =================================================
      // STEP 3
      // GET ACTUAL SCORE
      // =================================================

      console.log(
        "\n=============================================="
      );

      console.log(
        "3️⃣ GETTING ACTUAL SCORE"
      );

      console.log(
        "=============================================="
      );

      const {
        successCount,
        failedCount,
      } =
        await processScoreWithConcurrency(
          matches
        );

      // =================================================
      // COMPLETE
      // =================================================

      console.log(
        "\n=============================================="
      );

      console.log(
        "📊 ACTUAL SCORE SUMMARY"
      );

      console.log(
        "=============================================="
      );

      console.log(
        `✅ Score fetched: ${successCount}`
      );

      console.log(
        `⚠️ Score failed/not available: ${failedCount}`
      );

      console.log(
        "==============================================\n"
      );

    } catch (error) {

      console.error(
        "❌ processScoresFromRedis error:",
        error.message
      );
    }
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getAllScoreIds,
  updateMissingScoreIds,
  fetchActualScore,
  processScoresFromRedis,
};