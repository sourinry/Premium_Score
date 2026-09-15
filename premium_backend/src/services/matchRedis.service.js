const Match = require("../models/matchModel");

const redisClient = require("../config/redis");

const MATCH_REDIS_KEY =
  "matches:activeMatches";


// =====================================================
// SAVE MATCHES FROM DB TO REDIS
// =====================================================

const saveMatchesToRedis = async () => {
  try {
    const matches =
      await Match.find({
        isOld: false,
      })
        .sort({
          openDate: 1,
        })
        .lean();

    console.log(
      `📦 Active matches from DB: ${matches.length}`
    );

    await redisClient.set(
      MATCH_REDIS_KEY,
      JSON.stringify(matches)
    );

    console.log(
      `✅ ${matches.length} matches saved to Redis`
    );

    return matches;

  } catch (error) {
    console.error(
      "❌ saveMatchesToRedis error:",
      error.message
    );

    throw error;
  }
};


// =====================================================
// GET MATCHES FROM REDIS
// =====================================================

const getMatchesFromRedis = async () => {
  try {
    const data =
      await redisClient.get(
        MATCH_REDIS_KEY
      );

    if (!data) {
      console.log(
        "⚠️ No matches found in Redis"
      );

      return [];
    }

    const matches =
      JSON.parse(data);

    console.log(
      `📦 ${matches.length} matches loaded from Redis`
    );

    return matches;

  } catch (error) {
    console.error(
      "❌ getMatchesFromRedis error:",
      error.message
    );

    return [];
  }
};


module.exports = {
  saveMatchesToRedis,
  getMatchesFromRedis,
};