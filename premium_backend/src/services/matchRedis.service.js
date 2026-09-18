const Match = require("../models/matchModel");
const redisClient = require("../config/redis");
const MATCH_REDIS_KEY = "matches:activeMatches";

// SAVE MATCHES FROM DB TO REDIS

const saveMatchesToRedis = async () => {
  try {
    const matches = await Match.find({
      isOld: false,
    })
      .sort({
        openDate: 1,
      })
      .lean();
    await redisClient.set(MATCH_REDIS_KEY, JSON.stringify(matches));
    return matches;
  } catch (error) {
    throw error;
  }
};

// GET MATCHES FROM REDIS

const getMatchesFromRedis = async () => {
  try {
    const data = await redisClient.get(MATCH_REDIS_KEY);

    if (!data) {

      return [];
    }

    const matches = JSON.parse(data);

    return matches;
  } catch (error) {

    return [];
  }
};

module.exports = {
  saveMatchesToRedis,
  getMatchesFromRedis,
};
