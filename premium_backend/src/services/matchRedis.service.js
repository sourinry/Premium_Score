const Match = require("../models/matchModel");
const redisClient = require("../config/redis");

const MATCH_REDIS_KEY = "matches:activeMatches";

// SAVE MATCHES FROM DB TO REDIS

const saveMatchesToRedis = async () => {
  try {

    const matches = await Match.find({
      isOld: false,
    //   eventId:"36108897"
    })
      .sort({
        openDate: 1,
      })
      .lean();

    console.log(
      `📦Matches from MongoDB: ${matches.length}`
    );

    await redisClient.set(
      MATCH_REDIS_KEY,
      JSON.stringify(matches)
    );

 
    return matches;
  } catch (error) {
    console.error(
      "saveMatchesToRedis failed:",
      error?.stack || error?.message || error
    );

    throw error;
  }
};

// GET MATCHES FROM REDIS

const getMatchesFromRedis = async () => {
  try {
    const data = await redisClient.get(
      MATCH_REDIS_KEY
    );

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

module.exports = {
  saveMatchesToRedis,
  getMatchesFromRedis,
};