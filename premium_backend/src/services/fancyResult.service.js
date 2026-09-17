const Fancy = require("../models/fancyModel");
const { getMatchesFromRedis } = require("./matchRedis.service");
const { fetchActualScore } = require("./matchScore.service");

/* =========================================================
   AFTER MATCH COMPLETED FANCY CODES
========================================================= */

const AFTER_MATCH_COMPLETED_CODES = [
  "342",   // Will there be a tie
  "639",   // Total fours
  "640",   // Total sixes
  "647",   // Most fours
  "648",   // Most sixes
  "654",   // Total run outs
  "682",   // Total in highest scoring over
  "683",   // Top batter
  "684",   // Top bowler
  "695",   // Total ducks
  "698",   // Team with top batter
  "699",   // Team with top bowler
  "702",   // Top batter total
  "710",   // Which team wins coin toss and match
  "655",   // Total extras
  "696",   // Total wides
  "701",   // Any player to score 50 / 100
  "1131",  // Both teams to score 170
  "340",   // Winner incl super over
];

/* =========================================================
   GET RESULT MATCHES FROM REDIS
========================================================= */

const getResultMatchesFromRedis = async () => {
  try {
    const matches = await getMatchesFromRedis();

    console.log(`📦SSSSSSSSSSSSSSSSSSSSSSSS Total matches from Redis: ${matches.length}`);

    if (!Array.isArray(matches)) {
      return [];
    }

    const resultMatches = matches.filter(
      (match) =>
        String(match?.matchType || "").toLowerCase() === "all"
    );
console.log(resultMatches,"BBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");

 

    return resultMatches;
  } catch (error) {
    console.error(
      "❌ Error getting result matches from Redis:",
      error.message
    );

    return [];
  }
};

/* =========================================================
   GET FANCY BY EVENT ID
========================================================= */

const getFancyByEventId = async (eventId) => {
  try {
    if (!eventId) {
      return [];
    }

    const fancyList = await Fancy.find({
      eventId: String(eventId),
    }).lean();

    return Array.isArray(fancyList) ? fancyList : [];
  } catch (error) {
    console.error(
      `❌ Fancy DB error for eventId ${eventId}:`,
      error.message
    );

    return [];
  }
};

/* =========================================================
   GET AFTER MATCH COMPLETED FANCIES
========================================================= */

const getAfterMatchCompletedFancies = (fancyList = []) => {
  if (!Array.isArray(fancyList)) {
    return [];
  }

  return fancyList.filter((fancy) => {
    const fancyCode = String(
      fancy?.id ??
      fancy?.apiSiteMarketId ??
      ""
    );

    return AFTER_MATCH_COMPLETED_CODES.includes(fancyCode);
  });
};

/* =========================================================
   GET CRICKET SCORE
========================================================= */

const getCricketScore = (scoreResponse) => {
    console.log(scoreResponse.data?.scorecard?.score,"Score Response");
    
  return scoreResponse?.data?.scorecard?.score ?? null;
};

/* =========================================================
   GET CRICKET INNINGS
========================================================= */

const getCricketInnings = (scoreResponse) => {
  const score = getCricketScore(scoreResponse);

  if (!Array.isArray(score?.innings)) {
    return [];
  }

  return score.innings;
};

/* =========================================================
   342 - WILL THERE BE A TIE
========================================================= */

const getTieResult = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (innings.length < 2) {
    return null;
  }

  const team1Runs = Number(innings[0]?.runs || 0);
  const team2Runs = Number(innings[1]?.runs || 0);

  return team1Runs === team2Runs ? "YES" : "NO";
};

/* =========================================================
   639 - TOTAL FOURS
========================================================= */

const getTotalFours = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let totalFours = 0;

  for (const inning of innings) {
    const batsmen = Array.isArray(inning?.batsmen)
      ? inning.batsmen
      : [];

    for (const batsman of batsmen) {
      totalFours += Number(batsman?.fours || 0);
    }
  }

  return totalFours;
};

/* =========================================================
   640 - TOTAL SIXES
========================================================= */

const getTotalSixes = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let totalSixes = 0;

  for (const inning of innings) {
    const batsmen = Array.isArray(inning?.batsmen)
      ? inning.batsmen
      : [];

    for (const batsman of batsmen) {
      totalSixes += Number(batsman?.sixes || 0);
    }
  }

  return totalSixes;
};

/* =========================================================
   654 - TOTAL RUN OUTS
========================================================= */

const getTotalRunOuts = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let totalRunOuts = 0;

  for (const inning of innings) {
    const batsmen = Array.isArray(inning?.batsmen)
      ? inning.batsmen
      : [];

    for (const batsman of batsmen) {
      const description = String(
        batsman?.description || ""
      ).toLowerCase();

      if (description.includes("run out")) {
        totalRunOuts++;
      }
    }
  }

  return totalRunOuts;
};

/* =========================================================
   655 - TOTAL EXTRAS
========================================================= */

const getTotalExtras = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let totalExtras = 0;

  for (const inning of innings) {
    const extras = inning?.extrasSummary || {};

    totalExtras += Number(extras?.byes || 0);
    totalExtras += Number(extras?.noBalls || 0);
    totalExtras += Number(extras?.legByes || 0);
    totalExtras += Number(extras?.wides || 0);
    totalExtras += Number(extras?.penalties || 0);
  }

  return totalExtras;
};

/* =========================================================
   696 - TOTAL WIDES
========================================================= */

const getTotalWides = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let totalWides = 0;

  for (const inning of innings) {
    const extras = inning?.extrasSummary || {};

    totalWides += Number(extras?.wides || 0);
  }

  return totalWides;
};

/* =========================================================
   683 - TOP BATTER
========================================================= */

const getTopBatter = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let topBatter = null;
  let highestRuns = -1;

  for (const inning of innings) {
    const batsmen = Array.isArray(inning?.batsmen)
      ? inning.batsmen
      : [];

    for (const batsman of batsmen) {
      const runs = Number(batsman?.runs || 0);

      if (runs > highestRuns) {
        highestRuns = runs;

        topBatter = {
          name: batsman?.batsmanName || null,
          runs,
          teamName: inning?.teamName || null,
        };
      }
    }
  }

  return topBatter;
};

/* =========================================================
   684 - TOP BOWLER
========================================================= */

const getTopBowler = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let topBowler = null;
  let highestWickets = -1;

  for (const inning of innings) {
    const bowlers = Array.isArray(inning?.bowlers)
      ? inning.bowlers
      : [];

    for (const bowler of bowlers) {
      const wickets = Number(bowler?.wickets || 0);

      if (wickets > highestWickets) {
        highestWickets = wickets;

        topBowler = {
          name: bowler?.bowlerName || null,
          wickets,
        };
      }
    }
  }

  return topBowler;
};

/* =========================================================
   702 - TOP BATTER TOTAL
========================================================= */

const getTopBatterTotal = (scoreResponse) => {
  const topBatter = getTopBatter(scoreResponse);

  if (!topBatter) {
    return null;
  }

  return topBatter.runs;
};

/* =========================================================
   698 - TEAM WITH TOP BATTER
========================================================= */

const getTeamWithTopBatter = (scoreResponse) => {
  const topBatter = getTopBatter(scoreResponse);

  if (!topBatter) {
    return null;
  }

  return topBatter.teamName;
};

/* =========================================================
   699 - TEAM WITH TOP BOWLER
========================================================= */

const getTeamWithTopBowler = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let topBowler = null;
  let highestWickets = -1;
  let topBowlerTeam = null;

  for (const inning of innings) {
    const bowlers = Array.isArray(inning?.bowlers)
      ? inning.bowlers
      : [];

    for (const bowler of bowlers) {
      const wickets = Number(bowler?.wickets || 0);

      if (wickets > highestWickets) {
        highestWickets = wickets;
        topBowler = bowler?.bowlerName || null;
        topBowlerTeam = inning?.teamName || null;
      }
    }
  }

  if (!topBowler) {
    return null;
  }

  return topBowlerTeam;
};

/* =========================================================
   695 - TOTAL DUCKS
========================================================= */

const getTotalDucks = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (!innings.length) {
    return null;
  }

  let totalDucks = 0;

  for (const inning of innings) {
    const batsmen = Array.isArray(inning?.batsmen)
      ? inning.batsmen
      : [];

    for (const batsman of batsmen) {
      const runs = Number(batsman?.runs || 0);

      if (runs === 0) {
        totalDucks++;
      }
    }
  }

  return totalDucks;
};

/* =========================================================
   682 - TOTAL IN HIGHEST SCORING OVER
========================================================= */

const getHighestScoringOver = (scoreResponse) => {
  const score = getCricketScore(scoreResponse);

  const wormAndManhattan = Array.isArray(
    score?.wormAndManhattan
  )
    ? score.wormAndManhattan
    : [];

  if (!wormAndManhattan.length) {
    return null;
  }

  let highestRuns = 0;

  for (const over of wormAndManhattan) {
    const firstInnings = String(
      over?.firstInnings || ""
    );

    const secondInnings = String(
      over?.secondInnings || ""
    );

    const firstParts = firstInnings
      .split(",")
      .map((value) => Number(value));

    const secondParts = secondInnings
      .split(",")
      .map((value) => Number(value));

    const firstRuns = Number(firstParts[0] || 0);
    const secondRuns = Number(secondParts[0] || 0);

    highestRuns = Math.max(
      highestRuns,
      firstRuns,
      secondRuns
    );
  }

  return highestRuns;
};

/* =========================================================
   1131 - BOTH TEAMS TO SCORE 170
========================================================= */

const getBothTeams170 = (scoreResponse) => {
  const innings = getCricketInnings(scoreResponse);

  if (innings.length < 2) {
    return null;
  }

  const team1Runs = Number(innings[0]?.runs || 0);
  const team2Runs = Number(innings[1]?.runs || 0);

  return team1Runs >= 170 && team2Runs >= 170
    ? "YES"
    : "NO";
};

/* =========================================================
   CALCULATE FANCY RESULT
========================================================= */

const calculateFancyResult = (fancy, scoreResponse) => {
  const fancyCode = String(
    fancy?.id ??
    fancy?.apiSiteMarketId ??
    ""
  );

  switch (fancyCode) {
    case "342":
      return getTieResult(scoreResponse);

    case "639":
      return getTotalFours(scoreResponse);

    case "640":
      return getTotalSixes(scoreResponse);

    case "654":
      return getTotalRunOuts(scoreResponse);

    case "655":
      return getTotalExtras(scoreResponse);

    case "682":
      return getHighestScoringOver(scoreResponse);

    case "683":
      return getTopBatter(scoreResponse);

    case "684":
      return getTopBowler(scoreResponse);

    case "695":
      return getTotalDucks(scoreResponse);

    case "696":
      return getTotalWides(scoreResponse);

    case "698":
      return getTeamWithTopBatter(scoreResponse);

    case "699":
      return getTeamWithTopBowler(scoreResponse);

    case "702":
      return getTopBatterTotal(scoreResponse);

    case "1131":
      return getBothTeams170(scoreResponse);

    /*
      These codes are intentionally not calculated yet
      because the supplied getScore response does not
      provide enough confirmed information for their
      exact market semantics.
    */

    case "647":
      return null;

    case "648":
      return null;

    case "701":
      return null;

    case "710":
      return null;

    case "340":
      return null;

    default:
      return null;
  }
};

/* =========================================================
   PROCESS FANCY RESULT FOR ONE MATCH
========================================================= */

const processFancyResultForMatch = async (match) => {
  try {
    const eventId = String(match?.eventId || "");
    const sportId = Number(match?.sportId || 0);

    if (!eventId) {
      console.log("⚠️ Event ID missing");
      return;
    }

    if (sportId !== 4) {
      console.log(
        `⏭️ Skipping event ${eventId} - sportId ${sportId}`
      );
      return;
    }

    console.log("\n----------------------------------------------");
    console.log(`🎯 Processing Fancy Result`);
    console.log(`Event ID   : ${eventId}`);
    console.log(`Sport ID   : ${sportId}`);
    console.log(`Match Name : ${match?.eventName || "-"}`);
    console.log("----------------------------------------------");

    /* =====================================================
       GET FANCY FROM DB
    ===================================================== */

    const fancyList = await getFancyByEventId(eventId);

    if (!fancyList.length) {
      console.log(`ℹ️ No fancy found for event ${eventId}`);
      return;
    }

    const afterMatchFancies =
      getAfterMatchCompletedFancies(fancyList);

    if (!afterMatchFancies.length) {
      console.log(
        `ℹ️ No AFTER MATCH COMPLETED fancy found for event ${eventId}`
      );
      return;
    }

    console.log(
      `📋 After Match Fancies: ${afterMatchFancies.length}`
    );

    /* =====================================================
       GET SCORE FROM EXISTING SCORE SERVICE
    ===================================================== */

    const scoreResponse = await fetchActualScore(match);

    if (!scoreResponse) {
      console.log(
        `⚠️ No score response for event ${eventId}`
      );
      return;
    }

    const score = getCricketScore(scoreResponse);

    if (!score) {
      console.log(
        `⚠️ Cricket scorecard not available for event ${eventId}`
      );
      return;
    }

    /* =====================================================
       CALCULATE EACH FANCY
    ===================================================== */

    for (const fancy of afterMatchFancies) {
      const fancyCode = String(
        fancy?.id ??
        fancy?.apiSiteMarketId ??
        ""
      );

      const result = calculateFancyResult(
        fancy,
        scoreResponse
      );

      console.log("\n🎯 FANCY RESULT");
      console.log("Code       :", fancyCode);
      console.log(
        "Fancy Name :",
        fancy?.fancyName || fancy?.data?.marketName || "-"
      );
      console.log("Result     :", result);
    }

    console.log(
      `\n✅ Fancy result processing completed for ${eventId}`
    );
  } catch (error) {
    console.error(
      `❌ Fancy result processing failed for event ${match?.eventId}:`,
      error.message
    );
  }
};

/* =========================================================
   PROCESS ALL FANCY RESULTS
========================================================= */

const processFancyResults = async () => {
  try {
    console.log("\n==============================================");
    console.log("🎯 FANCY RESULT PROCESS STARTED");
    console.log("==============================================\n");

    const resultMatches =
      await getResultMatchesFromRedis();

      console.log(`📦 Total matches from Redis: ${resultMatches.length}`);

    if (!resultMatches.length) {
      console.log("ℹ️ No result matches found");
      return;
    }

    console.log(
      `🎯 Total result matches: ${resultMatches.length}`
    );

    for (const match of resultMatches) {
      await processFancyResultForMatch(match);
    }

    console.log("\n==============================================");
    console.log("✅ FANCY RESULT PROCESS COMPLETED");
    console.log("==============================================\n");
  } catch (error) {
    console.error(
      "❌ Fancy result process error:",
      error.message
    );
  }
};



const processSingleMatchResult = async (eventId) => {
  try {
    // 1. Redis se active matches lao
    const matches = await getMatchesFromRedis();

    if (!Array.isArray(matches)) {
      console.log("❌ Matches not found in Redis");
      return;
    }

    // 2. Sirf requested eventId + matchType All
    const match = matches.find(
      (item) =>
        String(item?.eventId) === String(eventId) &&
        String(item?.matchType || "").toLowerCase() === "all"
    );

    if (!match) {
      console.log(`❌ Match not found: ${eventId}`);
      return;
    }

    console.log("\n================================");
    console.log(`🎯 EVENT ID: ${eventId}`);
    console.log(`🏏 MATCH: ${match.eventName}`);
    console.log("================================");

    // 3. Fancy DB se records
    const fancyRecords = await Fancy.find({
      eventId: String(eventId),
    }).lean();

    console.log(`📦 Fancy records: ${fancyRecords.length}`);

    // 4. Score API se latest score
    const scoreResponse = await fetchActualScore(match);

      console.log(scoreResponse,"Score Response");

    if (!scoreResponse) {
      console.log("❌ Score response not found");
      return;
    }

    // fetchActualScore ka returned structure
    const score = scoreResponse?.data?.scorecard?.score;

    if (!score) {
      console.log("❌ Score data not found");
      return;
    }

    console.log("\n📊 SCORE DATA");
    console.log({
      matchTitle: score.matchTitle,
      status: score.matchStatus,
      innings: score.innings?.map((inning) => ({
        team: inning.teamName,
        runs: inning.runs,
        wickets: inning.wickets,
        overs: inning.overs,
        conclusion: inning.conclusion,
      })),
    });

    // 5. Har fancy ka result calculate karo
    for (const fancy of fancyRecords) {
      const code = String(fancy?.id);

      let result = null;

      switch (code) {
        case "342":
          result = calculateTieResult(score);
          break;

        case "639":
          result = calculateTotalFours(score);
          break;

        case "640":
          result = calculateTotalSixes(score);
          break;

        case "647":
          result = calculateMostFours(score);
          break;

        case "648":
          result = calculateMostSixes(score);
          break;

        case "654":
          result = calculateTotalRunOuts(score);
          break;

        case "655":
          result = calculateTotalExtras(score);
          break;

        case "682":
          result = calculateHighestScoringOver(score);
          break;

        case "683":
          result = calculateTopBatter(score);
          break;

        case "684":
          result = calculateTopBowler(score);
          break;

        case "695":
          result = calculateTotalDucks(score);
          break;

        case "696":
          result = calculateTotalWides(score);
          break;

        case "698":
          result = calculateTeamWithTopBatter(score);
          break;

        case "699":
          result = calculateTeamWithTopBowler(score);
          break;

        case "702":
          result = calculateTopBatterTotal(score);
          break;

        case "1131":
          result = calculateBothTeams170(score);
          break;

        default:
          result = null;
      }

      console.log("\n--------------------------------");
      console.log("Fancy:", fancy.fancyName);
      console.log("Code:", code);
      console.log("Result:", result);
      console.log("--------------------------------");
    }

    return {
      eventId,
      match: match.eventName,
      score,
      fancyCount: fancyRecords.length,
    };
  } catch (error) {
    console.error(
      `❌ Single match result error [${eventId}]:`,
      error.message
    );
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  processFancyResults,
  processFancyResultForMatch,
  calculateFancyResult,

  getResultMatchesFromRedis,
  getFancyByEventId,
  getAfterMatchCompletedFancies,

  getCricketScore,
  getCricketInnings,

  getTieResult,
  getTotalFours,
  getTotalSixes,
  getTotalRunOuts,
  getTotalExtras,
  getTotalWides,
  getHighestScoringOver,
  getTopBatter,
  getTopBowler,
  getTopBatterTotal,
  getTeamWithTopBatter,
  getTeamWithTopBowler,
  getTotalDucks,
  getBothTeams170,
  processSingleMatchResult,
  
};