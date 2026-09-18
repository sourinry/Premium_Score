
const { getMatchesFromRedis } = require("./matchRedis.service");
const redisClient = require("../config/redis");
const Fancy = require("../models/fancyModel");


       
// GET SCORE REDIS KEY
       

const getScoreRedisKey = (eventId, sportId) => {
  return `score:eventId:${eventId}:sportId:${sportId}`;
};


       
// STRING VALUE
       

const toStringValue = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  return String(value);
};


       
// NUMBER VALUE
       

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};


       
// GET SPECIFIER
       

const getSpecifier = (fancy) => {
  const value =
    fancy?.apiSiteSpecifier ??
    fancy?.data?.apiSiteSpecifier ??
    null;

  if (value === undefined || value === null) {
    return null;
  }

  return String(value).trim();
};


       
// GET SELECTIONS
       

const getSelections = (fancy) => {
  if (Array.isArray(fancy?.data?.sportsBookSelection)) {
    return fancy.data.sportsBookSelection;
  }

  if (Array.isArray(fancy?.sportsBookSelection)) {
    return fancy.sportsBookSelection;
  }

  return [];
};


       
// FIND API SITE SELECTION ID
       

const findSelection = (fancy, condition) => {
  const selections = getSelections(fancy);

  const selection = selections.find(condition);

  if (!selection) {
    return null;
  }

  return selection?.apiSiteSelectionId != null
    ? String(selection.apiSiteSelectionId)
    : null;
};


       
// FIND BY NAME
       

const findByName = (fancy, name) => {
  if (!name) {
    return null;
  }

  const target = String(name).trim().toLowerCase();

  return findSelection(fancy, (selection) => {
    const selectionName = String(
      selection?.selectionName ??
        selection?.name ??
        selection?.apiSiteSelectionName ??
        ""
    )
      .trim()
      .toLowerCase();

    return (
      selectionName === target ||
      selectionName.includes(target) ||
      target.includes(selectionName)
    );
  });
};


       
// OVER / UNDER
       

const findOverUnder = (fancy, isOver) => {
  return findSelection(fancy, (selection) => {
    console.log(selection, "ASHSSUSHSHHHSH");

    const name = String(
      selection?.selectionName ??
        selection?.name ??
        selection?.apiSiteSelectionName ??
        ""
    )
      .trim()
      .toLowerCase();

    if (isOver) {
      return (
        name === "over" ||
        name.startsWith("over ") ||
        name.startsWith("over")
      );
    }

    return (
      name === "under" ||
      name.startsWith("under ") ||
      name.startsWith("under")
    );
  });
};


       
// YES / NO
       

const findYesNo = (fancy, yes) => {
  return findSelection(fancy, (selection) => {
    const name = String(
      selection?.selectionName ??
        selection?.name ??
        selection?.apiSiteSelectionName ??
        ""
    )
      .trim()
      .toLowerCase();

    if (yes) {
      return name === "yes";
    }

    return name === "no";
  });
};


       
// TEAM SELECTION
       

const findTeamSelection = (fancy, teamName) => {
  if (!teamName) {
    return null;
  }

  const target = String(teamName).trim().toLowerCase();

  return findSelection(fancy, (selection) => {
    const name = String(
      selection?.selectionName ??
        selection?.name ??
        selection?.apiSiteSelectionName ??
        ""
    )
      .trim()
      .toLowerCase();

    return (
      name === target ||
      name.includes(target) ||
      target.includes(name)
    );
  });
};


       
// PLAYER SELECTION
       

const findPlayerSelection = (
  fancy,
  playerId,
  playerName = null
) => {
  const playerIdString = toStringValue(playerId);

  const selections = getSelections(fancy);

  const selection = selections.find((item) => {
    const selectionId = toStringValue(
      item?.apiSiteSelectionId
    );

    const itemPlayerId = toStringValue(
      item?.playerId ??
        item?.apiSitePlayerId ??
        item?.selectionId
    );

    if (
      playerIdString &&
      (itemPlayerId === playerIdString ||
        selectionId === playerIdString)
    ) {
      return true;
    }

    if (playerName) {
      const selectionName = String(
        item?.selectionName ??
          item?.name ??
          item?.apiSiteSelectionName ??
          ""
      )
        .trim()
        .toLowerCase();

      const targetName = String(playerName)
        .trim()
        .toLowerCase();

      if (
        selectionName === targetName ||
        selectionName.includes(targetName) ||
        targetName.includes(selectionName)
      ) {
        return true;
      }
    }

    return false;
  });

  return selection?.apiSiteSelectionId != null
    ? String(selection.apiSiteSelectionId)
    : null;
};


       
// GET SCORE OBJECT
       

const getScoreObject = (scoreResponse) => {
  return scoreResponse?.scorecard?.score ?? null;
};


       
// GET INNINGS
       

const getInnings = (scoreResponse) => {
  const innings = getScoreObject(scoreResponse)?.innings;

  return Array.isArray(innings) ? innings : [];
};


       
// GET ALL BATSMEN
       

const getAllBatsmen = (scoreResponse) => {
  const innings = getInnings(scoreResponse);

  return innings.flatMap((inning) =>
    Array.isArray(inning?.batsmen)
      ? inning.batsmen
      : []
  );
};


       
// GET ALL BOWLERS
       

const getAllBowlers = (scoreResponse) => {
  const innings = getInnings(scoreResponse);

  return innings.flatMap((inning) =>
    Array.isArray(inning?.bowlers)
      ? inning.bowlers
      : []
  );
};


       
// MATCH COMPLETION CHECK
       

const isMatchCompleted = (scoreResponse) => {
  const shortName =
    scoreResponse?.timeline?.match?.status?.shortName;

  const matchStatus =
    scoreResponse?.scorecard?.score?.matchStatus;

  return (
    String(shortName).toUpperCase() === "END" 
  );
};


       
// MARKET RESULT CALCULATION
       

const calculateFancyResult = (
  fancy,
  scoreResponse
) => {
  const marketId = String(
    fancy?.apiSiteMarketId ?? ""
  ).trim();

  if (!marketId) {
    return null;
  }

  const score = getScoreObject(scoreResponse);

  if (!score) {
    return null;
  }

  const innings = getInnings(scoreResponse);
  const batsmen = getAllBatsmen(scoreResponse);
  const bowlers = getAllBowlers(scoreResponse);

  const timelineMatch =
    scoreResponse?.timeline?.match;

  const resultInfo =
    timelineMatch?.resultinfo;

  const specifier = getSpecifier(fancy);


         
  // 342 - WILL THERE BE A TIE
  // Redis directly gives winningteam
         

  if (marketId === "342") {
    const winningTeam =
      resultInfo?.winningteam;

    if (!winningTeam) {
      return null;
    }

    const isTie =
      winningTeam !== "home" &&
      winningTeam !== "away";

    return findYesNo(
      fancy,
      isTie
    );
  }


         
  // 682 - HIGHEST SCORING OVER
         

  if (marketId === "682") {
    const wormAndManhattan =
      score?.wormAndManhattan;

    if (
      !Array.isArray(wormAndManhattan) ||
      !specifier
    ) {
      return null;
    }

    let specifierData;

    try {
      specifierData =
        JSON.parse(specifier);
    } catch {
      return null;
    }

    const target =
      toNumber(specifierData?.total);

    const maxOvers =
      toNumber(specifierData?.maxovers);

    if (
      target === null ||
      maxOvers === null
    ) {
      return null;
    }

    let highestRuns = -Infinity;

    wormAndManhattan.forEach((item) => {
      const overNumber =
        toNumber(item?.overNumber);

      if (
        overNumber === null ||
        overNumber > maxOvers
      ) {
        return;
      }

      const firstInnings =
        String(
          item?.firstInnings || ""
        ).split(",");

      const secondInnings =
        String(
          item?.secondInnings || ""
        ).split(",");

      const firstRuns =
        toNumber(firstInnings[0]);

      const secondRuns =
        toNumber(secondInnings[0]);

      if (firstRuns !== null) {
        highestRuns =
          Math.max(
            highestRuns,
            firstRuns
          );
      }

      if (secondRuns !== null) {
        highestRuns =
          Math.max(
            highestRuns,
            secondRuns
          );
      }
    });

    if (highestRuns === -Infinity) {
      return null;
    }

    return highestRuns > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }


  // 654 - TOTAL RUN OUTS

  if (marketId === "654") {
    const runOutCount =
      batsmen.filter((batsman) =>
        String(
          batsman?.description ?? ""
        )
          .toLowerCase()
          .includes("run out")
      ).length;

    const target =
      toNumber(specifier);

    if (target === null) {
      return null;
    }

    return runOutCount > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }


         
  // 683 - HIGHEST BATSMAN RUNS
         

  if (marketId === "683") {
    if (!batsmen.length) {
      return null;
    }

    let highestBatsman = null;
    let highestRuns = -Infinity;

    batsmen.forEach((batsman) => {
      const runs =
        toNumber(batsman?.runs);

      if (
        runs !== null &&
        runs > highestRuns
      ) {
        highestRuns = runs;
        highestBatsman = batsman;
      }
    });

    if (!highestBatsman) {
      return null;
    }

    return findPlayerSelection(
      fancy,
      highestBatsman?.playerId,
      highestBatsman?.batsmanName
    );
  }


         
  // 684 - HIGHEST BOWLER WICKETS
         

  if (marketId === "684") {
    if (!bowlers.length) {
      return null;
    }

    let highestBowler = null;
    let highestWickets = -Infinity;

    bowlers.forEach((bowler) => {
      const wickets =
        toNumber(bowler?.wickets);

      if (
        wickets !== null &&
        wickets > highestWickets
      ) {
        highestWickets = wickets;
        highestBowler = bowler;
      }
    });

    if (!highestBowler) {
      return null;
    }

    return findPlayerSelection(
      fancy,
      highestBowler?.playerId,
      highestBowler?.bowlerName
    );
  }


         
  // 695 - TOTAL DUCKS
         

  if (marketId === "695") {
    const ducks =
      batsmen.filter((batsman) => {
        const runs =
          toNumber(batsman?.runs);

        return runs === 0;
      }).length;

    const target =
      toNumber(specifier);

    if (target === null) {
      return null;
    }

    return ducks > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }


         
  // 698 - TEAM WITH TOP BATSMAN
         

  if (marketId === "698") {
    if (!batsmen.length) {
      return null;
    }

    let topBatsman = null;
    let highestRuns = -Infinity;

    batsmen.forEach((batsman) => {
      const runs =
        toNumber(batsman?.runs);

      if (
        runs !== null &&
        runs > highestRuns
      ) {
        highestRuns = runs;
        topBatsman = batsman;
      }
    });

    if (!topBatsman) {
      return null;
    }

    const playerId =
      topBatsman?.playerId;

    const playerInning =
      innings.find(
        (inning) =>
          Array.isArray(
            inning?.batsmen
          ) &&
          inning.batsmen.some(
            (batsman) =>
              String(
                batsman?.playerId
              ) === String(playerId)
          )
      );

    if (!playerInning?.teamName) {
      return null;
    }

    return findTeamSelection(
      fancy,
      playerInning.teamName
    );
  }


         
  // 699 - TEAM WITH TOP BOWLER
         

  if (marketId === "699") {
    if (!bowlers.length) {
      return null;
    }

    let topBowler = null;
    let highestWickets = -Infinity;

    bowlers.forEach((bowler) => {
      const wickets =
        toNumber(bowler?.wickets);

      if (
        wickets !== null &&
        wickets > highestWickets
      ) {
        highestWickets = wickets;
        topBowler = bowler;
      }
    });

    if (!topBowler) {
      return null;
    }

    const playerId =
      topBowler?.playerId;

    const playerInning =
      innings.find(
        (inning) =>
          Array.isArray(
            inning?.bowlers
          ) &&
          inning.bowlers.some(
            (bowler) =>
              String(
                bowler?.playerId
              ) === String(playerId)
          )
      );

    if (!playerInning?.teamName) {
      return null;
    }

    return findTeamSelection(
      fancy,
      playerInning.teamName
    );
  }


         
  // 702 - TOP BATSMAN RUNS OVER / UNDER
         

  if (marketId === "702") {
    if (!batsmen.length) {
      return null;
    }

    let highestRuns = -Infinity;

    batsmen.forEach((batsman) => {
      const runs =
        toNumber(batsman?.runs);

      if (
        runs !== null &&
        runs > highestRuns
      ) {
        highestRuns = runs;
      }
    });

    const target =
      toNumber(specifier);

    if (
      target === null ||
      highestRuns === -Infinity
    ) {
      return null;
    }

    return highestRuns > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }


         
  // 696 - TOTAL WIDES
         

  if (marketId === "696") {
    let totalWides = 0;

    innings.forEach((inning) => {
      const wides =
        toNumber(
          inning?.extrasSummary?.wides
        );

      if (wides !== null) {
        totalWides += wides;
      }
    });

    const target =
      toNumber(specifier);

    if (target === null) {
      return null;
    }

    return totalWides > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }


         
  // 701 - PLAYER MILESTONE YES / NO
         

  if (marketId === "701") {
    const target =
      toNumber(specifier);

    if (target === null) {
      return null;
    }

    const playerId =
      fancy?.data?.playerId ??
      fancy?.playerId ??
      null;

    const playerName =
      fancy?.data?.playerName ??
      fancy?.playerName ??
      null;

    const player =
      batsmen.find((batsman) => {
        if (
          playerId &&
          String(
            batsman?.playerId
          ) === String(playerId)
        ) {
          return true;
        }

        if (playerName) {
          return String(
            batsman?.batsmanName ?? ""
          )
            .toLowerCase()
            .includes(
              String(playerName)
                .toLowerCase()
            );
        }

        return false;
      });

    if (!player) {
      return null;
    }

    const runs =
      toNumber(player?.runs);

    if (runs === null) {
      return null;
    }

    return findYesNo(
      fancy,
      runs >= target
    );
  }


         
  // 1131 - BOTH TEAM SCORE MILESTONE
         

  if (marketId === "1131") {
    const target =
      toNumber(specifier);

    if (target === null) {
      return null;
    }

    const resultInnings =
      resultInfo?.innings ?? {};

    const inningValues =
      Object.values(resultInnings);

    if (!inningValues.length) {
      return null;
    }

    const bothTeamsPassed =
      inningValues.length >= 2 &&
      inningValues.every((inning) => {
        const runs =
          toNumber(inning?.runs);

        return (
          runs !== null &&
          runs >= target
        );
      });

    return findYesNo(
      fancy,
      bothTeamsPassed
    );
  }


         
  // 340 - MATCH WINNER
  // Redis directly gives winningteam
         

  if (marketId === "340") {
    const winningTeam =
      resultInfo?.winningteam;

    if (!winningTeam) {
      return null;
    }

    const teamName =
      winningTeam === "home"
        ? timelineMatch?.teams?.home?.name
        : winningTeam === "away"
          ? timelineMatch?.teams?.away?.name
          : null;

    if (!teamName) {
      return null;
    }

    return findTeamSelection(
      fancy,
      teamName
    );
  }


         
  // 639 - TOTAL FOURS
         

  if (marketId === "639") {
    let totalFours = 0;

    batsmen.forEach((batsman) => {
      const fours =
        toNumber(batsman?.fours);

      if (fours !== null) {
        totalFours += fours;
      }
    });

    const target =
      toNumber(specifier);

    if (target === null) {
      return null;
    }

    return totalFours > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }


         
  // 640 - TOTAL SIXES
         

  if (marketId === "640") {
    let totalSixes = 0;

    batsmen.forEach((batsman) => {
      const sixes =
        toNumber(batsman?.sixes);

      if (sixes !== null) {
        totalSixes += sixes;
      }
    });

    const target =
      toNumber(specifier);

    if (target === null) {
      return null;
    }

    return totalSixes > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }


         
  // 655 - TOTAL EXTRAS
         

  if (marketId === "655") {
    let totalExtras = 0;

    innings.forEach((inning) => {
      const extras =
        inning?.extrasSummary;

      if (!extras) {
        return;
      }

      totalExtras +=
        (toNumber(extras?.byes) ?? 0) +
        (toNumber(extras?.noBalls) ?? 0) +
        (toNumber(extras?.legByes) ?? 0) +
        (toNumber(extras?.wides) ?? 0) +
        (toNumber(extras?.penalties) ?? 0);
    });

    const target =
      toNumber(specifier);

    if (target === null) {
      return null;
    }

    return totalExtras > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }


         
  // 710 - TOSS WINNER SAME AS MATCH WINNER
         

  if (marketId === "710") {
    const winningTeam =
      resultInfo?.winningteam;

    const tossWinner =
      timelineMatch?.coinToss?.winner ??
      timelineMatch?.coinToss?.winningteam ??
      timelineMatch?.coinToss?.team ??
      null;

    if (!winningTeam || !tossWinner) {
      return null;
    }

    const sameTeam =
      String(winningTeam).toLowerCase() ===
      String(tossWinner).toLowerCase();

    return findYesNo(
      fancy,
      sameTeam
    );
  }


  return null;
};


       
// PROCESS SINGLE MATCH RESULT
       

const processSingleMatchResult = async (eventId) => {
  try {
    const matches =
      await getMatchesFromRedis();

    if (!Array.isArray(matches)) {
      return [];
    }

    const match = matches.find(
      (item) =>
        String(item?.eventId) ===
        String(eventId)
    );

    if (!match) {
      return [];
    }

    const sportId =
      Number(match?.sportId);

    if (sportId !== 4) {
      return [];
    }

    const scoreKey =
      getScoreRedisKey(
        eventId,
        sportId
      );

    const scoreRedis =
      await redisClient.get(scoreKey);

    if (!scoreRedis) {
      return [];
    }

    let scoreResponse;

    try {
      const parsed =
        JSON.parse(scoreRedis);

      scoreResponse =
        parsed?.data ?? parsed;

    } catch (parseError) {
      console.error(
        `Score Redis JSON parse error | eventId=${eventId}:`,
        parseError.message
      );

      return [];
    }

    const completed =
      isMatchCompleted(scoreResponse);

    if (!completed) {
      return [];
    }

    const fancies =
      await Fancy.find({
        eventId: String(eventId),
        sportId: sportId,
      }).lean();

    if (
      !Array.isArray(fancies) ||
      !fancies.length
    ) {
      return [];
    }


           
    // CALCULATE ALL RESULTS
           

    const results = [];

    for (const fancy of fancies) {
      try {
        const marketId =
          String(
            fancy?.apiSiteMarketId ?? ""
          );

        if (!marketId) {
          continue;
        }

        const apiSiteSelectionId =
          calculateFancyResult(
            fancy,
            scoreResponse
          );

        if (!apiSiteSelectionId) {
          continue;
        }

        const resultData = {
          eventId: String(eventId),
          sportId: sportId,
          apiSiteMarketId: marketId,
          apiSiteSelectionId:
            String(apiSiteSelectionId),
          fancyName:
            fancy?.fancyName ?? null,
        };

        results.push(resultData);

        console.log(
          `🏆 RESULT FOUND | eventId=${eventId} | market=${marketId} | fancy=${fancy?.fancyName} | apiSiteSelectionId=${apiSiteSelectionId}`
        );

      } catch (fancyError) {
        // console.error(
        //   ` Fancy result calculation error | eventId=${eventId} | market=${fancy?.apiSiteMarketId}:`,
        //   fancyError.message
        // );

        console.error(
          fancyError.stack
        );
      }
    }


           
    // FINAL SUMMARY
           

    return results;

  } catch (error) {
    console.error(error.stack);

    return [];
  }
};


       
// PROCESS ALL COMPLETED MATCHES
       

const processAllCompletedFancyResults = async () => {
  try {
    const matches =
      await getMatchesFromRedis();

    if (!Array.isArray(matches)) {
      return [];
    }

    const cricketMatches =
      matches.filter(
        (match) =>
          Number(match?.sportId) === 4
      );

    const allResults = [];

    for (const match of cricketMatches) {
      const results =
        await processSingleMatchResult(
          match.eventId
        );

      if (
        Array.isArray(results) &&
        results.length
      ) {
        allResults.push(...results);
      }
    }

    return allResults;

  } catch (error) {
    console.error(error.stack);

    return [];
  }
};


module.exports = {
  processSingleMatchResult,
  processAllCompletedFancyResults,
  calculateFancyResult,
  isMatchCompleted,
};























