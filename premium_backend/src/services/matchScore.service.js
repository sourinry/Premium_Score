const axios = require("axios");

const Match = require("../models/matchModel");
const { getMatchesFromRedis } = require("./matchRedis.service");
const redisClient = require("../config/redis");

// APIs

const GET_ALL_SCORE_ID_API = "http://3.6.53.212:3000/api/match/getAllScoreId";
const GET_SCORE_API = "http://3.6.53.212:3000/api/match/getScore";

// REDIS SCORE KEY

const getScoreRedisKey = (eventId, sportId) => {
  return `score:eventId:${eventId}:sportId:${sportId}`;
};

// SCORE API CONCURRENCY

const SCORE_CONCURRENCY = 5;

// SUPPORTED SPORTS

const SUPPORTED_SPORT_IDS = [1, 2, 4];

// SCORE ID UPDATE INTERVAL

// Har 10 seconds me getAllScoreId API call hogi
// aur DB me scoreId = "0" wale matches update honge.
const SCORE_ID_UPDATE_INTERVAL = 10 * 1000;

// STEP 1
// GET ALL SCORE IDS

const getAllScoreIds = async () => {
  try {
    const response = await axios.get(GET_ALL_SCORE_ID_API, {
      timeout: 30000,

      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = response?.data?.result;

    if (!Array.isArray(result)) {
      return new Map();
    }

    const scoreIdMap = new Map();

    for (const item of result) {
      const eventId = String(item?.eventId || "").trim();
      const scoreId = String(item?.scoreId || "").trim();

      // Invalid data skip
      if (!eventId || !scoreId || scoreId == "0") {
        continue;
      }

      scoreIdMap.set(eventId, scoreId);
    }

    return scoreIdMap;
  } catch (error) {
    if (error.response) {
      return new Map();
    }
    return new Map();
  }
};

// STEP 2
// UPDATE DB MATCHES HAVING scoreId = "0"

const updateMissingScoreIds = async (matches, scoreIdMap) => {
  let updatedCount = 0;
  let alreadyExistsCount = 0;
  let notFoundCount = 0;

  // GET ONLY DB MATCHES WHERE SCORE ID IS 0

  const dbMatches = await Match.find({
    sportId: {
      $in: SUPPORTED_SPORT_IDS,
    },

    scoreId: "0",

    isOld: false,
  }).lean();

  // LOOP DB MATCHES

  for (const dbMatch of dbMatches) {
    const eventId = String(dbMatch?.eventId || "").trim();
    const sportId = Number(dbMatch?.sportId);

    if (!eventId || !SUPPORTED_SPORT_IDS.includes(sportId)) {
      continue;
    }

    // FIND SCORE ID FROM API RESPONSE

    const scoreId = scoreIdMap.get(eventId);
    if (!scoreId) {
      notFoundCount++;
      continue;
    }

    const updateResult = await Match.updateOne(
      {
        _id: dbMatch._id,
        scoreId: "0",
      },
      {
        $set: {
          scoreId: String(scoreId),
        },
      },
    );

    // UPDATE SUCCESS

    if (updateResult.matchedCount > 0 && updateResult.modifiedCount > 0) {
      updatedCount++;

      // UPDATE CURRENT REDIS MATCH OBJECT

      const redisMatch = matches.find(
        (match) =>
          String(match?.eventId || "").trim() === eventId &&
          Number(match?.sportId) === sportId,
      );

      if (redisMatch) {
        redisMatch.scoreId = String(scoreId);
      }
    } else if (
      updateResult.matchedCount > 0 &&
      updateResult.modifiedCount === 0
    ) {
      alreadyExistsCount++;
    } else {
    }
  }

  // SUMMARY

  return {
    updatedCount,
    alreadyExistsCount,
    notFoundCount,
  };
};

// UPDATE HOME / AWAY TEAM FROM SCORE API

const updateHomeAwayTeams = async (eventId, sportId, responseData) => {
  try {
    let homeName = null;
    let awayName = null;

    if (sportId == 2) {
      homeName = responseData?.result?.match?.teams?.home?.name;
      awayName = responseData?.result?.match?.teams?.away?.name;
    }

    else if (sportId == 1) {
      homeName = responseData?.result?.match?.teams?.home?.mediumname;
      awayName = responseData?.result?.match?.teams?.away?.mediumname;
    }

    else if (sportId == 4) {
      homeName = responseData?.result?.timeline?.match?.teams?.home?.mediumname;
      awayName = responseData?.result?.timeline?.match?.teams?.away?.mediumname;
    }

    // UPDATE ONLY IF TEAM NAME AVAILABLE
    if (!homeName && !awayName) {
      return;
    }

    const updateData = {};

    if (homeName) {
      updateData.homeTeam = String(homeName).trim();
    }

    if (awayName) {
      updateData.awayTeam = String(awayName).trim();
    }

    const updateResult = await Match.updateOne(
      {
        eventId: String(eventId).trim(),
        sportId: sportId,
      },
      {
        $set: updateData,
      },
    );
  } catch (error) {}
};

// STEP 3
// GET ACTUAL SCORE FOR ONE MATCH

const fetchActualScore = async (match) => {
  try {
    const eventId = String(match?.eventId || "").trim();
    const sportId = Number(match?.sportId);
    const scoreId = String(match?.scoreId || "").trim();


    if (!eventId) {
      return null;
    }

    if (!SUPPORTED_SPORT_IDS.includes(sportId)) {
      return null;
    }

    if (!scoreId || scoreId == "0") {
      return null;
    }

    // GET SCORE API

    const url = `${GET_SCORE_API}/${eventId}/${sportId}`;

    const scoreGet = await axios.get(url, {
      timeout: 30000,

      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseData = scoreGet?.data;
    await updateHomeAwayTeams(eventId, sportId, responseData);

    // EVENT NOT FOUND

    const scoreMessage = responseData?.result?.scorecard?.message;

    if (scoreMessage == "Event not found.") {
      return null;
    }

    // PREPARE SCORE RESPONSE

    let resp;

    if (sportId == 4) {
      resp = {
        scorecard: responseData?.result?.scorecard,
        timeline: responseData?.result?.timeline,
      };
    }
    // TENNIS
    else if (sportId === 1) {
      resp = {
        result: responseData?.result ?? null,
      };
    }
    // SOCCER
    else if (sportId == 2) {
      resp = {
        result: responseData?.result ?? null,
      };
    }

    // SAVE ACTUAL SCORE IN REDIS

    const redisKey = getScoreRedisKey(eventId, sportId);
    const redisData = {
      eventId,
      sportId,
      scoreId,
      data: resp,
      updatedAt: new Date().toISOString(),
    };

    await redisClient.set(redisKey, JSON.stringify(redisData));
    return redisData;
  } catch (error) {
    // HTTP ERROR

    if (error.response) {
      return null;
    }
    // TIMEOUT
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return null;
    }

    // CONNECTION REFUSED
    return null;
  }
};

// STEP 4
// PROCESS SCORE WITH LIMITED CONCURRENCY

const processScoreWithConcurrency = async (matches) => {
  let successCount = 0;
  let failedCount = 0;

  // ONLY MATCHES HAVING VALID SCORE ID

  const validMatches = matches.filter((match) => {
    const scoreId = String(match?.scoreId || "").trim();
    return scoreId && scoreId !== "0";
  });

  // PROCESS IN BATCHES

  for (let i = 0; i < validMatches.length; i += SCORE_CONCURRENCY) {
    const batch = validMatches.slice(i, i + SCORE_CONCURRENCY);
    const results = await Promise.all(
      batch.map((match) => fetchActualScore(match)),
    );

    for (const result of results) {
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

// 10 SECOND SCORE ID SYNC

let scoreIdSyncRunning = false;

const runScoreIdSync = async () => {
  // Agar previous cycle abhi chal raha hai
  // to duplicate API call mat karo.
  if (scoreIdSyncRunning) {
    return;
  }

  scoreIdSyncRunning = true;

  try {
    // GET ALL SCORE IDS

    const scoreIdMap = await getAllScoreIds();
    if (!scoreIdMap || scoreIdMap.size === 0) {
      return;
    }

    const matches = await getMatchesFromRedis();
    if (!Array.isArray(matches)) {
      return;
    }
    await updateMissingScoreIds(matches, scoreIdMap);
  } catch (error) {
  } finally {
    scoreIdSyncRunning = false;
  }
};

// START 10 SECOND SCORE ID SYNC

const startScoreIdSync = () => {
  runScoreIdSync();
  // Har 10 seconds
  setInterval(runScoreIdSync, SCORE_ID_UPDATE_INTERVAL);
};

// PROCESS ALL MATCHES FROM REDIS

const processScoresFromRedis = async () => {
  try {
    const matches = await getMatchesFromRedis();
    if (!Array.isArray(matches) || matches.length === 0) {
      return;
    }

    const scoreIdMap = await getAllScoreIds();
    await updateMissingScoreIds(matches, scoreIdMap);
    const { successCount, failedCount } =
      await processScoreWithConcurrency(matches);
  } catch (error) {}
};

module.exports = {
  getAllScoreIds,
  updateMissingScoreIds,
  fetchActualScore,
  processScoresFromRedis,
  runScoreIdSync,
  startScoreIdSync,
};
