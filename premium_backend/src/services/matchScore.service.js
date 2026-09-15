const axios = require("axios");

const Match = require("../models/matchModel");

const {
  getMatchesFromRedis,
} = require("./matchRedis.service");


// =====================================================
// SCORE API
// =====================================================

const SCORE_API =
  "http://3.6.53.212:3000/api/match/getScore";


// =====================================================
// GET SCORE ID ACCORDING TO SPORT
// =====================================================

const getScoreId = (responseData, sportId) => {

  // ===================================================
  // CRICKET
  // sportId = 4
  // ===================================================

  if (Number(sportId) === 4) {

    const scoreId =
      responseData
        ?.result
        ?.scorecard
        ?.score
        ?.premiumCricketEventId;

    if (
      scoreId !== undefined &&
      scoreId !== null &&
      String(scoreId).trim() !== ""
    ) {
      return String(scoreId).trim();
    }

    return null;
  }


  // ===================================================
  // TENNIS
  // sportId = 1
  // ===================================================

  if (Number(sportId) === 1) {

    /*
      Tennis API response example:

      {
        "message": "Score Fetched!!!",
        "result": []
      }

      Is response me scoreId available nahi hai.
    */

    const result =
      responseData?.result;

    // Agar result array hai aur empty hai
    if (
      Array.isArray(result) &&
      result.length === 0
    ) {
      return null;
    }

    // Agar future me result.match aaye
    const scoreId =
      result?.match?._id ??
      result?.match?.id ??
      result?._id ??
      result?.id ??
      null;

    if (
      scoreId !== undefined &&
      scoreId !== null &&
      String(scoreId).trim() !== ""
    ) {
      return String(scoreId).trim();
    }

    return null;
  }


  // ===================================================
  // SOCCER
  // sportId = 2
  // ===================================================

  if (Number(sportId) === 2) {

    const scoreId =
      responseData
        ?.result
        ?.match
        ?._id;

    if (
      scoreId !== undefined &&
      scoreId !== null &&
      String(scoreId).trim() !== ""
    ) {
      return String(scoreId).trim();
    }

    return null;
  }


  return null;
};


// =====================================================
// GET SCORE FOR ONE MATCH
// =====================================================

const fetchScoreForMatch = async (match) => {

  try {

    // =================================================
    // EVENT ID
    // =================================================

    const eventId =
      String(
        match?.eventId || ""
      ).trim();


    // =================================================
    // SPORT ID
    // =================================================

    const sportId =
      Number(match?.sportId);


    // =================================================
    // VALIDATION
    // =================================================

    if (!eventId) {

      console.log(
        "⚠️ Score skipped: eventId missing"
      );

      return null;
    }


    if (
      ![1, 2, 4].includes(sportId)
    ) {

      console.log(
        `⚠️ Score skipped: invalid sportId=${sportId} | eventId=${eventId}`
      );

      return null;
    }


    // =================================================
    // URL
    // =================================================

    const url =
      `${SCORE_API}/${eventId}/${sportId}`;


    console.log(
      `🎯 Fetching score | eventId=${eventId} | sportId=${sportId}`
    );

    console.log(
      `🌐 Score URL: ${url}`
    );


    // =================================================
    // API CALL
    // =================================================

    const response =
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


    // =================================================
    // RESPONSE
    // =================================================

    const responseData =
      response?.data;


    // =================================================
    // CHECK EVENT NOT FOUND
    // =================================================

    const scoreMessage =
      responseData
        ?.result
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
    // GET SCORE ID
    // =================================================

    const scoreId =
      getScoreId(
        responseData,
        sportId
      );


    // =================================================
    // SCORE ID NOT FOUND
    // =================================================

    if (!scoreId) {

      console.log(
        `⚠️ scoreId not available | eventId=${eventId} | sportId=${sportId}`
      );

      return null;
    }


    // =================================================
    // UPDATE MONGODB
    // =================================================

    const updateResult =
      await Match.updateOne(
        {
          eventId: eventId,

          sportId: sportId,
        },

        {
          $set: {
            scoreId: scoreId,
          },
        }
      );


    // =================================================
    // MATCH NOT FOUND
    // =================================================

    if (
      updateResult.matchedCount === 0
    ) {

      console.log(
        `⚠️ Match not found in DB | eventId=${eventId} | sportId=${sportId}`
      );

      return null;
    }


    // =================================================
    // SUCCESS
    // =================================================

    console.log(
      `✅ scoreId updated | eventId=${eventId} | sportId=${sportId} | scoreId=${scoreId}`
    );


    return {
      eventId: eventId,

      sportId: sportId,

      scoreId: scoreId,
    };

  } catch (error) {

    // =================================================
    // AXIOS RESPONSE ERROR
    // =================================================

    if (error.response) {

      console.error(
        `❌ Score API failed | eventId=${match?.eventId} | sportId=${match?.sportId}`
      );

      console.error(
        `HTTP Status: ${error.response.status}`
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
      error.code ===
      "ECONNABORTED"
    ) {

      console.error(
        `⏰ Score API timeout | eventId=${match?.eventId} | sportId=${match?.sportId}`
      );

      return null;
    }


    // =================================================
    // CONNECTION REFUSED
    // =================================================

    if (
      error.code ===
      "ECONNREFUSED"
    ) {

      console.error(
        `🔌 Score API connection refused | eventId=${match?.eventId} | sportId=${match?.sportId}`
      );

      return null;
    }


    // =================================================
    // GENERAL ERROR
    // =================================================

    console.error(
      `❌ Score failed | eventId=${match?.eventId} | sportId=${match?.sportId}:`,
      error.message
    );

    return null;
  }
};


// =====================================================
// PROCESS ALL MATCHES FROM REDIS
// =====================================================

const processScoresFromRedis = async () => {

  try {

    console.log(
      "\n=========================================="
    );

    console.log(
      "🎯 SCORE SERVICE STARTED"
    );

    console.log(
      "=========================================="
    );


    // =================================================
    // GET MATCHES FROM REDIS
    // =================================================

    const matches =
      await getMatchesFromRedis();


    // =================================================
    // NO MATCHES
    // =================================================

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
      `📦 Processing ${matches.length} matches from Redis`
    );


    // =================================================
    // SPORT COUNT
    // =================================================

    const cricketMatches =
      matches.filter(
        (match) =>
          Number(match.sportId) === 4
      );

    const tennisMatches =
      matches.filter(
        (match) =>
          Number(match.sportId) === 1
      );

    const soccerMatches =
      matches.filter(
        (match) =>
          Number(match.sportId) === 2
      );


    console.log(
      `🏏 Cricket: ${cricketMatches.length}`
    );

    console.log(
      `🎾 Tennis: ${tennisMatches.length}`
    );

    console.log(
      `⚽ Soccer: ${soccerMatches.length}`
    );


    // =================================================
    // COUNTERS
    // =================================================

    let successCount = 0;

    let failedCount = 0;


    // =================================================
    // PROCESS MATCHES
    // =================================================

    for (
      const match of matches
    ) {

      const result =
        await fetchScoreForMatch(
          match
        );


      if (result) {

        successCount++;

      } else {

        failedCount++;
      }
    }


    // =================================================
    // COMPLETE
    // =================================================

    console.log(
      "\n=========================================="
    );

    console.log(
      "✅ SCORE SERVICE COMPLETED"
    );

    console.log(
      `✅ Score updated: ${successCount}`
    );

    console.log(
      `⚠️ Score not available/failed: ${failedCount}`
    );

    console.log(
      "==========================================\n"
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
  fetchScoreForMatch,
  processScoresFromRedis,
};