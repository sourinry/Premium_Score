const axios = require("axios");

const Match = require("../models/matchModel");

const {
  getMatchesFromRedis,
} = require("./matchRedis.service");

const redisClient = require("../config/redis");

// APIs

const GET_ALL_SCORE_ID_API =
  "http://3.6.53.212:3000/api/match/getAllScoreId";

const GET_SCORE_API =
  "http://3.6.53.212:3000/api/match/getScore";

// REDIS SCORE KEY

const getScoreRedisKey = (eventId, sportId) => {
  return `score:eventId:${eventId}:sportId:${sportId}`;
};

// STEP 1
// GET ALL SCORE IDS

const getAllScoreIds = async () => {
  try {
    console.log("\n==============================================");
    console.log("1️⃣ GETTING ALL SCORE IDS");
    console.log("==============================================");

    const response = await axios.get(GET_ALL_SCORE_ID_API, {
      timeout: 30000,

      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = response?.data?.result;

    if (!Array.isArray(result)) {
      console.log("⚠️ getAllScoreId result is not an array");

      return new Map();
    }

    console.log(
      `📦 Total scoreIds received: ${result.length}`,
    );

    const scoreIdMap = new Map();

    for (const item of result) {
      const eventId = String(
        item?.eventId || "",
      ).trim();

      const scoreId = String(
        item?.scoreId || "",
      ).trim();

      if (!eventId || !scoreId || scoreId === "0") {
        continue;
      }

      scoreIdMap.set(eventId, scoreId);
    }

    console.log(
      `✅ Valid scoreId mappings: ${scoreIdMap.size}`,
    );

    return scoreIdMap;
  } catch (error) {
    if (error.response) {
      console.error(
        "❌ getAllScoreId API failed",
      );

      console.error(
        "HTTP Status:",
        error.response.status,
      );

      console.error(
        "Response:",
        JSON.stringify(
          error.response.data,
          null,
          2,
        ),
      );

      return new Map();
    }

    if (error.code === "ECONNABORTED") {
      console.error(
        "⏰ getAllScoreId API timeout",
      );

      return new Map();
    }

    console.error(
      "❌ getAllScoreId error:",
      error.message,
    );

    return new Map();
  }
};

// UPDATE MISSING SCORE IDS IN DB

const updateMissingScoreIds = async (
  matches,
  scoreIdMap,
) => {
  let updatedCount = 0;
  let alreadyExistsCount = 0;
  let notFoundCount = 0;

  for (const match of matches) {
    const eventId = String(
      match?.eventId || "",
    ).trim();

    const sportId = Number(match?.sportId);

    if (!eventId || ![1, 2, 4].includes(sportId)) {
      continue;
    }

    const currentScoreId = String(
      match?.scoreId ?? "",
    ).trim();

    // Already has scoreId

    if (
      currentScoreId &&
      currentScoreId !== "0"
    ) {
      alreadyExistsCount++;

      continue;
    }

    // Find scoreId from getAllScoreId

    const scoreId = scoreIdMap.get(eventId);

    if (!scoreId) {
      notFoundCount++;

      console.log(
        `⚠️ scoreId not found | eventId=${eventId} | sportId=${sportId}`,
      );

      continue;
    }

    // Update MongoDB

    const updateResult = await Match.updateOne(
      {
        eventId,
        sportId,
      },
      {
        $set: {
          scoreId,
        },
      },
    );

    if (updateResult.matchedCount > 0) {
      updatedCount++;

      // Redis match object bhi update kar do
      match.scoreId = scoreId;

      console.log(
        `✅ scoreId updated | eventId=${eventId} | sportId=${sportId} | scoreId=${scoreId}`,
      );
    } else {
      console.log(
        `⚠️ Match not found in DB | eventId=${eventId} | sportId=${sportId}`,
      );
    }
  }

 
  return {
    updatedCount,
    alreadyExistsCount,
    notFoundCount,
  };
};

// STEP 3
// GET ACTUAL SCORE

const fetchActualScore = async (match) => {
  try {
    const eventId = String(
      match?.eventId || "",
    ).trim();

    const sportId = Number(match?.sportId);

    const scoreId = String(
      match?.scoreId || "",
    ).trim();

    if (!eventId) {
      console.log(
        "⚠️ Actual score skipped: eventId missing",
      );

      return null;
    }

    if (![1, 2, 4].includes(sportId)) {
      console.log(
        `⚠️ Actual score skipped: invalid sportId=${sportId}`,
      );

      return null;
    }

    if (!scoreId || scoreId === "0") {
      console.log(
        `⚠️ Actual score skipped: scoreId missing | eventId=${eventId}`,
      );

      return null;
    }

    // -------------------------------------------------
    // GET SCORE API
    // -------------------------------------------------

    const url =
      `${GET_SCORE_API}/${eventId}/${sportId}`;

    console.log(
      `\n🎯 GETTING ACTUAL SCORE | eventId=${eventId} | sportId=${sportId} | scoreId=${scoreId}`,
    );

    console.log(
      `🌐 ${url}`,
    );

    const scoreGet = await axios.get(url, {
      timeout: 30000,

      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseData = scoreGet?.data;

    // =================================================
    // EVENT NOT FOUND
    // =================================================

    const scoreMessage =
      responseData?.result?.scorecard?.message;

    if (
      scoreMessage === "Event not found."
    ) {
      console.log(
        `⚠️ Event not found | eventId=${eventId} | sportId=${sportId}`,
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
          responseData?.result?.scorecard,

        timeline:
          responseData?.result?.timeline,
      };
    }

    // =================================================
    // TENNIS
    // =================================================

    else if (sportId === 1) {
      // Tennis me jo actual response aa raha hai
      // usko preserve kar rahe hain

      resp = {
        result:
          responseData?.result ?? null,
      };
    }

    // =================================================
    // SOCCER
    // =================================================

    else if (sportId === 2) {
      // Soccer me jo actual result aa raha hai
      // usko preserve kar rahe hain

      resp = {
        result:
          responseData?.result ?? null,
      };
    }

    // =================================================
    // SAVE SCORE IN REDIS
    // =================================================

    const redisKey =
      getScoreRedisKey(
        eventId,
        sportId,
      );

    const redisData = {
      eventId,
      sportId,
      scoreId,
      data: resp,
      updatedAt: new Date().toISOString(),
    };

    await redisClient.set(
      redisKey,
      JSON.stringify(redisData),
    );

    console.log(
      `✅ Actual score saved in Redis | key=${redisKey}`,
    );

    return redisData;
  } catch (error) {
    if (error.response) {
      console.error(
        `❌ getScore API failed | eventId=${match?.eventId} | sportId=${match?.sportId}`,
      );

      console.error(
        "HTTP Status:",
        error.response.status,
      );

      console.error(
        "Response:",
        JSON.stringify(
          error.response.data,
          null,
          2,
        ),
      );

      return null;
    }

    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      console.error(
        `⏰ getScore API timeout | eventId=${match?.eventId} | sportId=${match?.sportId}`,
      );

      return null;
    }

    if (
      error.code === "ECONNREFUSED"
    ) {
      console.error(
        `🔌 getScore connection refused | eventId=${match?.eventId} | sportId=${match?.sportId}`,
      );

      return null;
    }

    console.error(
      `❌ Actual score failed | eventId=${match?.eventId} | sportId=${match?.sportId}:`,
      error.message,
    );

    return null;
  }
};

// PROCESS ALL MATCHES

const processScoresFromRedis = async () => {
  try {
    console.log("\n");
    console.log("==============================================");
    console.log("🎯 SCORE SERVICE STARTED");
    console.log("==============================================");

    // -------------------------------------------------
    // GET MATCHES FROM REDIS
    // -------------------------------------------------

    const matches =
      await getMatchesFromRedis();

    if (
      !Array.isArray(matches) ||
      matches.length === 0
    ) {
      console.log(
        "⚠️ No matches available in Redis",
      );

      return;
    }

    console.log(
      `📦 Matches from Redis: ${matches.length}`,
    );

    // STEP 1
    // GET ALL SCORE IDS

    const scoreIdMap =
      await getAllScoreIds();

    // STEP 2
    // UPDATE MISSING SCORE IDS

    await updateMissingScoreIds(
      matches,
      scoreIdMap,
    );

    // STEP 3
    // GET ACTUAL SCORE

    console.log("\n==============================================");
    console.log("3️⃣ GETTING ACTUAL SCORE");
    console.log("==============================================");

    let successCount = 0;
    let failedCount = 0;

    for (const match of matches) {
      const result =
        await fetchActualScore(match);

      if (result) {
        successCount++;
      } else {
        failedCount++;
      }
    }


    console.log("==============================================\n");
  } catch (error) {
    console.error(
      "❌ processScoresFromRedis error:",
      error.message,
    );
  }
};



module.exports = {
  getAllScoreIds,
  updateMissingScoreIds,
  fetchActualScore,
  processScoresFromRedis,
};