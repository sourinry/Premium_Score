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
    fancy?.apiSiteSpecifier ?? fancy?.data?.apiSiteSpecifier ?? null;

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

const getWinnerSelection = (fancy, selectionId) => {
  if (!selectionId) {
    return null;
  }

  const selections = getSelections(fancy);

  const selection = selections.find(
    (item) => String(item?.apiSiteSelectionId) === String(selectionId),
  );

  if (!selection) {
    return null;
  }

  return {
    id: selection?.id ?? null,
    apiSiteSelectionId: selection?.apiSiteSelectionId ?? null,
    selectionName: selection?.selectionName,
  };
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
        "",
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
    const name = String(selection?.selectionName || "")
      .trim()
      .toLowerCase();

    if (isOver) {
      return name.startsWith("over");
    }

    return name.startsWith("under");
  });
};

// YES / NO

const findYesNo = (fancy, yes) => {
  return findSelection(fancy, (selection) => {
    const name = String(selection?.selectionName || "")
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
        "",
    )
      .trim()
      .toLowerCase();

    return name === target || name.includes(target) || target.includes(name);
  });
};

// PLAYER SELECTION

const findPlayerSelection = (fancy, playerId, playerName = null) => {
  const playerIdString = toStringValue(playerId);

  const selections = getSelections(fancy);

  const selection = selections.find((item) => {
    const selectionId = toStringValue(item?.apiSiteSelectionId);

    const itemPlayerId = toStringValue(
      item?.playerId ?? item?.apiSitePlayerId ?? item?.selectionId,
    );

    if (
      playerIdString &&
      (itemPlayerId === playerIdString || selectionId === playerIdString)
    ) {
      return true;
    }

    if (playerName) {
      const selectionName = String(
        item?.selectionName ?? item?.name ?? item?.apiSiteSelectionName ?? "",
      )
        .trim()
        .toLowerCase();

      const targetName = String(playerName).trim().toLowerCase();

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
    Array.isArray(inning?.batsmen) ? inning.batsmen : [],
  );
};

// GET ALL BOWLERS

const getAllBowlers = (scoreResponse) => {
  const innings = getInnings(scoreResponse);

  return innings.flatMap((inning) =>
    Array.isArray(inning?.bowlers) ? inning.bowlers : [],
  );
};


const getInningCompleteTeamData = async (fancy, scoreResponse) => {
  const match = await getActiveMatchByEventId(fancy?.eventId);

  if (!match) {
    return null;
  }

  const homeTeam = String(match?.homeTeam ?? "").trim();
  const awayTeam = String(match?.awayTeam ?? "").trim();

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const innings = getInnings(scoreResponse);

  if (!Array.isArray(innings) || !innings.length) {
    return null;
  }

  const fancyName = String(fancy?.fancyName ?? "").trim();

  if (!fancyName) {
    return null;
  }

  const normalizedFancyName = fancyName.toLowerCase();

  let targetTeam = null;

  if (normalizedFancyName.includes(homeTeam.toLowerCase())) {
    targetTeam = homeTeam;
  } else if (normalizedFancyName.includes(awayTeam.toLowerCase())) {
    targetTeam = awayTeam;
  }

  if (!targetTeam) {
    return null;
  }

  const targetInning = innings.find(
    (inning) =>
      String(inning?.teamName ?? "")
        .trim()
        .toLowerCase() === targetTeam.toLowerCase()
  );

  if (!targetInning) {
    return null;
  }

  return {
    targetTeam,
    targetInning,
    innings,
  };
};

// MATCH COMPLETION CHECK

const isMatchCompleted = (scoreResponse) => {
  const shortName = scoreResponse?.timeline?.match?.status?.shortName;

  const matchStatus = scoreResponse?.scorecard?.score?.matchStatus;

  return String(shortName).toUpperCase() === "END";
};

// MARKET RESULT CALCULATION

const calculateFancyResult = async (fancy, scoreResponse) => {
  const marketId = String(fancy?.apiSiteMarketId ?? "").trim();

  if (!marketId) {
    return null;
  }

  if (!isMatchCompleted(scoreResponse)) {
    return null;
  }

  const score = getScoreObject(scoreResponse);

  if (!score) {
    return null;
  }

  const innings = getInnings(scoreResponse);
  const batsmen = getAllBatsmen(scoreResponse);
  const bowlers = getAllBowlers(scoreResponse);

  const timelineMatch = scoreResponse?.timeline?.match;

  const resultInfo = timelineMatch?.resultinfo;

  const specifier = getSpecifier(fancy);

  // 342 - WILL THERE BE A TIE
  // Redis directly gives winningteam

  if (marketId === "342") {
    const winningTeam = resultInfo?.winningteam;

    if (!winningTeam) {
      return null;
    }

    const isTie = winningTeam !== "home" && winningTeam !== "away";

    return findYesNo(fancy, isTie);
  }

  // 682 - HIGHEST SCORING OVER

  if (marketId === "682") {
    const wormAndManhattan = score?.wormAndManhattan;

    if (!Array.isArray(wormAndManhattan) || !specifier) {
      return null;
    }

    let specifierData;

    try {
      specifierData = JSON.parse(specifier);
    } catch {
      return null;
    }

    const target = toNumber(specifierData?.total);

    const maxOvers = toNumber(specifierData?.maxovers);

    if (target === null || maxOvers === null) {
      return null;
    }

    let highestRuns = -Infinity;

    wormAndManhattan.forEach((item) => {
      const overNumber = toNumber(item?.overNumber);

      if (overNumber === null || overNumber > maxOvers) {
        return;
      }

      const firstInnings = String(item?.firstInnings || "").split(",");

      const secondInnings = String(item?.secondInnings || "").split(",");

      const firstRuns = toNumber(firstInnings[0]);

      const secondRuns = toNumber(secondInnings[0]);

      if (firstRuns !== null) {
        highestRuns = Math.max(highestRuns, firstRuns);
      }

      if (secondRuns !== null) {
        highestRuns = Math.max(highestRuns, secondRuns);
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
    if (!isMatchCompleted(scoreResponse)) {
      return null;
    }

    const target = toNumber(parseSpecifier(fancy)?.total);

    if (target === null) {
      return null;
    }

    const runOutCount = batsmen.filter((batsman) =>
      String(batsman?.description ?? "")
        .trim()
        .toLowerCase()
        .includes("run out"),
    ).length;

    return findOverUnder(fancy, runOutCount > target);
  }

  // 683 - HIGHEST BATSMAN RUNS

  if (marketId === "683") {
    if (!batsmen.length) {
      return null;
    }

    let highestBatsman = null;
    let highestRuns = -Infinity;

    batsmen.forEach((batsman) => {
      const runs = toNumber(batsman?.runs);

      if (runs !== null && runs > highestRuns) {
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
      highestBatsman?.batsmanName,
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
      const wickets = toNumber(bowler?.wickets);

      if (wickets !== null && wickets > highestWickets) {
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
      highestBowler?.bowlerName,
    );
  }

  // 695 - TOTAL DUCKS

if (marketId === "695") {
  const ducks = batsmen.filter((batsman) => {
    const runs = Number(batsman?.runs);

    const description = String(
      batsman?.description ?? ""
    )
      .trim()
      .toLowerCase();

    return (
      runs === 0 &&
      batsman?.toCome !== true &&
      description !== "" &&
      description !== "not out"
    );
  }).length;

  let target = null;

  try {
    const specifierData = JSON.parse(specifier);

    target = Number(specifierData?.total);
  } catch {
    return null;
  }

  if (Number.isNaN(target)) {
    return null;
  }

  return ducks > target
    ? findOverUnder(fancy, true)
    : findOverUnder(fancy, false);
}

  // 698 - TEAM WITH TOP BATSMAN

  if (marketId === "698") {
    if (!isMatchCompleted(scoreResponse)) {
      return null;
    }

    if (!innings.length) {
      return null;
    }

    let topBatsmanTeam = null;
    let highestRuns = -1;

    for (const inning of innings) {
      for (const batsman of inning?.batsmen ?? []) {
        const runs = toNumber(batsman?.runs);

        if (runs !== null && runs > highestRuns) {
          highestRuns = runs;
          topBatsmanTeam = inning?.teamName;
        }
      }
    }

    return topBatsmanTeam ? findTeamSelection(fancy, topBatsmanTeam) : null;
  }

  // 699 - TEAM WITH TOP BOWLER

  if (marketId === "699") {
    if (!isMatchCompleted(scoreResponse)) {
      return null;
    }

    if (!innings.length) {
      return null;
    }

    let topBowlerTeam = null;
    let highestWickets = -1;

    for (const inning of innings) {
      for (const bowler of inning?.bowlers ?? []) {
        const wickets = toNumber(bowler?.wickets);

        if (wickets !== null && wickets > highestWickets) {
          highestWickets = wickets;
          topBowlerTeam = inning?.teamName;
        }
      }
    }

    return topBowlerTeam ? findTeamSelection(fancy, topBowlerTeam) : null;
  }

  // 702 - TOP BATSMAN RUNS OVER / UNDER

  if (marketId === "702") {
    if (!batsmen.length) {
      return null;
    }

    const matchEnded =
      String(scoreResponse?.timeline?.match?.status?.shortName ?? "")
        .trim()
        .toUpperCase() === "END";

    if (!matchEnded) {
      return null;
    }

    const specifierData = parseSpecifier(fancy);

    const target = toNumber(specifierData?.total);

    if (target === null) {
      return null;
    }

    let highestRuns = null;

    for (const batsman of batsmen) {
      const runs = toNumber(batsman?.runs);

      if (runs === null) {
        continue;
      }

      if (highestRuns === null || runs > highestRuns) {
        highestRuns = runs;
      }
    }

    if (highestRuns === null) {
      return null;
    }

    const isOver = highestRuns > target;

    return findOverUnder(fancy, isOver);
  }

  // 696 - TOTAL WIDES

  if (marketId === "696") {
    let totalWides = 0;

    innings.forEach((inning) => {
      const wides = toNumber(inning?.extrasSummary?.wides);

      if (wides !== null) {
        totalWides += wides;
      }
    });

    const target = toNumber(specifier);

    if (target === null) {
      return null;
    }

    return totalWides > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }

  // 701 - PLAYER MILESTONE YES / NO

  if (marketId === "701") {
    if (!batsmen.length) {
      return null;
    }

    const specifierData = parseSpecifier(fancy);

    const milestone = toNumber(specifierData?.milestone);

    if (milestone === null) {
      return null;
    }

    const playerReachedMilestone = batsmen.some((batsman) => {
      const runs = toNumber(batsman?.runs);

      if (runs === null) {
        return false;
      }

      return runs >= milestone;
    });

    return findYesNo(fancy, playerReachedMilestone);
  }

  // 1131 - BOTH TEAMS TO SCORE MILESTONE

 if (marketId === "1131") {

  const milestone = toNumber(
    parseSpecifier(fancy)?.milestone
  );

  if (milestone === null) {
    return null;
  }

  const matchEnded =
    String(
      scoreResponse
        ?.timeline
        ?.match
        ?.status
        ?.shortName ?? ""
    )
      .trim()
      .toUpperCase() === "END";

  if (!matchEnded) {
    return null;
  }

  const innings = getInnings(
    scoreResponse
  );

  if (
    !Array.isArray(innings) ||
    innings.length < 2
  ) {
    return null;
  }

  const firstInning = innings[0];
  const secondInning = innings[1];

  const firstRuns = toNumber(
    firstInning?.runs
  );

  const secondRuns = toNumber(
    secondInning?.runs
  );

  if (
    firstRuns === null ||
    secondRuns === null
  ) {
    return null;
  }

  const bothTeamsPassed =
    firstRuns >= milestone &&
    secondRuns >= milestone;

  return findYesNo(
    fancy,
    bothTeamsPassed
  );
}

  // 340 - MATCH WINNER
  // Redis directly gives winningteam

  if (marketId === "340") {
    const winningTeam = resultInfo?.winningteam;

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

    return findTeamSelection(fancy, teamName);
  }

  // 639 - TOTAL FOURS

  if (marketId === "639") {
    let totalFours = 0;

    batsmen.forEach((batsman) => {
      const fours = toNumber(batsman?.fours);

      if (fours !== null) {
        totalFours += fours;
      }
    });

    const target = toNumber(specifier);

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
      const sixes = toNumber(batsman?.sixes);

      if (sixes !== null) {
        totalSixes += sixes;
      }
    });

    const target = toNumber(specifier);

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
      const extras = inning?.extrasSummary;

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

    const target = toNumber(specifier);

    if (target === null) {
      return null;
    }

    return totalExtras > target
      ? findOverUnder(fancy, true)
      : findOverUnder(fancy, false);
  }

  // 710 - TOSS WINNER SAME AS MATCH WINNER

  if (marketId === "710") {
    const winningTeam = String(resultInfo?.winningteam ?? "")
      .trim()
      .toLowerCase();

    const tossWinner = String(timelineMatch?.coinToss?.winner ?? "")
      .trim()
      .toLowerCase();

    if (!winningTeam || !tossWinner) {
      return null;
    }

    if (winningTeam === tossWinner) {
      const teamName =
        winningTeam === "home"
          ? timelineMatch?.teams?.home?.name
          : winningTeam === "away"
            ? timelineMatch?.teams?.away?.name
            : null;

      if (!teamName) {
        return null;
      }

      return findTeamSelection(fancy, teamName);
    }

    return findSelection(
      fancy,
      (selection) =>
        String(selection?.selectionName ?? "")
          .trim()
          .toLowerCase() === "neither",
    );
  }

  return null;
};


// ===================================================
// INNING COMPLETE FANCY RESULT
// ===================================================

const calculateInningCompleteFancyResult = async (
  fancy,
  scoreResponse
) => {
  const marketId = String(
    fancy?.apiSiteMarketId ?? ""
  ).trim();

  // 700 - ANY PLAYER TO SCORE DYNAMIC MILESTONE


  if (marketId === "700") {
    const specifierData = parseSpecifier(fancy);

    const milestone = toNumber(
      specifierData?.milestone
    );

    const inningNumber = toNumber(
      specifierData?.inningnr
    );

    if (
      milestone === null ||
      inningNumber === null ||
      inningNumber <= 0
    ) {
      return null;
    }

    const innings = getInnings(scoreResponse);

    if (
      !Array.isArray(innings) ||
      !innings.length
    ) {
      return null;
    }

    const targetInning =
      innings[inningNumber - 1];

    if (!targetInning) {
      return null;
    }

    const batsmen = Array.isArray(
      targetInning?.batsmen
    )
      ? targetInning.batsmen
      : [];

    if (!batsmen.length) {
      return null;
    }

    const playerReached = batsmen.some(
      (batsman) => {
        const runs = toNumber(
          batsman?.runs
        );

        return (
          runs !== null &&
          runs >= milestone
        );
      }
    );

    // YES
    if (playerReached) {
      return findYesNo(
        fancy,
        true
      );
    }

    // NO only after innings completed
    if (
      String(
        targetInning?.conclusion ?? ""
      )
        .trim()
        .toLowerCase() === "completed"
    ) {
      return findYesNo(
        fancy,
        false
      );
    }

    return null;
  }

  // ===================================================
  // COMMON INNING DATA
  // ===================================================

  const inningData =
    await getInningCompleteTeamData(
      fancy,
      scoreResponse
    );

  if (!inningData) {
    return null;
  }

  const {
    targetTeam,
    targetInning,
  } = inningData;

  const batsmen = Array.isArray(
    targetInning?.batsmen
  )
    ? targetInning.batsmen
    : [];

  const bowlers = Array.isArray(
    targetInning?.bowlers
  )
    ? targetInning.bowlers
    : [];

  // ===================================================
  // 658 / 659 - TOTAL FOURS
  // ===================================================

  if (
    marketId === "658" ||
    marketId === "659"
  ) {
    let totalFours = 0;

    batsmen.forEach((batsman) => {
      const fours = toNumber(
        batsman?.fours
      );

      if (fours !== null) {
        totalFours += fours;
      }
    });

    const target = toNumber(
      parseSpecifier(fancy)?.total
    );

    if (target === null) {
      return null;
    }

    return findOverUnder(
      fancy,
      totalFours > target
    );
  }

  // ===================================================
  // 660 / 661 - TOTAL SIXES
  // ===================================================

  if (
    marketId === "660" ||
    marketId === "661"
  ) {
    let totalSixes = 0;

    batsmen.forEach((batsman) => {
      const sixes = toNumber(
        batsman?.sixes
      );

      if (sixes !== null) {
        totalSixes += sixes;
      }
    });

    const target = toNumber(
      parseSpecifier(fancy)?.total
    );

    if (target === null) {
      return null;
    }

    return findOverUnder(
      fancy,
      totalSixes > target
    );
  }

  // ===================================================
  // 668 / 669 - TOTAL RUN OUTS
  // ===================================================

  if (
    marketId === "668" ||
    marketId === "669"
  ) {
    let runOuts = 0;

    batsmen.forEach((batsman) => {
      const description = String(
        batsman?.description ?? ""
      )
        .trim()
        .toLowerCase();

      if (
        description.includes("run out")
      ) {
        runOuts++;
      }
    });

    const target = toNumber(
      parseSpecifier(fancy)?.total
    );

    if (target === null) {
      return null;
    }

    return findOverUnder(
      fancy,
      runOuts > target
    );
  }

  // ===================================================
  // 666 / 667 - TOTAL EXTRAS
  // ===================================================

  if (
    marketId === "666" ||
    marketId === "667"
  ) {
    const extras =
      targetInning?.extrasSummary;

    if (!extras) {
      return null;
    }

    const totalExtras =
      (toNumber(extras?.byes) ?? 0) +
      (toNumber(extras?.noBalls) ?? 0) +
      (toNumber(extras?.legByes) ?? 0) +
      (toNumber(extras?.wides) ?? 0) +
      (toNumber(extras?.penalties) ?? 0);

    const target = toNumber(
      parseSpecifier(fancy)?.total
    );

    if (target === null) {
      return null;
    }

    return findOverUnder(
      fancy,
      totalExtras > target
    );
  }

  // ===================================================
  // 674 / 675 - TOP BATTER
  // ===================================================

if (
  marketId === "674" ||
  marketId === "675"
) {
  if (!batsmen.length) {
    return null;
  }

  const inningCompleted =
    String(
      targetInning?.conclusion ?? ""
    )
      .trim()
      .toLowerCase() === "completed";

  const matchEnded =
    String(
      scoreResponse
        ?.timeline
        ?.match
        ?.status
        ?.shortName ?? ""
    )
      .trim()
      .toUpperCase() === "END";

  if (
    !inningCompleted &&
    !matchEnded
  ) {
    return null;
  }

  let topBatsman = null;
  let highestRuns = -1;

  batsmen.forEach((batsman) => {
    const runs = toNumber(
      batsman?.runs
    );

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

  return findPlayerSelection(
    fancy,
    topBatsman?.playerId,
    topBatsman?.batsmanName
  );
}

  // ===================================================
  // 676 / 677 - TOP BOWLER
  // ===================================================

  if (
    marketId === "676" ||
    marketId === "677"
  ) {
    if (!bowlers.length) {
      return null;
    }

    let topBowler = null;
    let highestWickets = -1;

    bowlers.forEach((bowler) => {
      const wickets = toNumber(
        bowler?.wickets
      );

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

    return findPlayerSelection(
      fancy,
      topBowler?.playerId,
      topBowler?.bowlerName
    );
  }

  // ===================================================
  // 670 / 671 - HIGHEST SCORING OVER
  // ===================================================

  if (
    marketId === "670" ||
    marketId === "671"
  ) {
    const wormAndManhattan =
      scoreResponse?.scorecard?.score
        ?.wormAndManhattan;

    if (
      !Array.isArray(wormAndManhattan)
    ) {
      return null;
    }

    const targetInningIndex =
      inningData.innings.findIndex(
        (inning) =>
          String(
            inning?.teamName ?? ""
          )
            .trim()
            .toLowerCase() ===
          String(
            targetTeam ?? ""
          )
            .trim()
            .toLowerCase()
      );

    const inningsKey =
      targetInningIndex === 0
        ? "firstInnings"
        : targetInningIndex === 1
          ? "secondInnings"
          : null;

    if (!inningsKey) {
      return null;
    }

    let highestRuns = -1;

    wormAndManhattan.forEach((item) => {
      const value =
        item?.[inningsKey];

      if (!value) {
        return;
      }

      const parts =
        String(value).split(",");

      const runs = toNumber(
        parts[0]
      );

      if (runs !== null) {
        highestRuns = Math.max(
          highestRuns,
          runs
        );
      }
    });

    if (highestRuns < 0) {
      return null;
    }

    const target = toNumber(
      parseSpecifier(fancy)?.total
    );

    if (target === null) {
      return null;
    }

    return findOverUnder(
      fancy,
      highestRuns > target
    );
  }

  // ===================================================
  // 706 / 707 - TOTAL DUCKS
  // ===================================================



if (
  marketId === "706" ||
  marketId === "707"
) {

  const match = await getActiveMatchByEventId(
    fancy?.eventId
  );

  if (!match) {
    return null;
  }

  const homeTeam = String(
    match?.homeTeam ?? ""
  ).trim();

  const awayTeam = String(
    match?.awayTeam ?? ""
  ).trim();

  const fancyName = String(
    fancy?.fancyName ?? ""
  ).trim();

  if (
    !homeTeam ||
    !awayTeam ||
    !fancyName
  ) {
    return null;
  }

  const normalizedFancyName =
    fancyName.toLowerCase();

  let targetTeam = null;

  if (
    normalizedFancyName.includes(
      homeTeam.toLowerCase()
    )
  ) {
    targetTeam = homeTeam;
  } else if (
    normalizedFancyName.includes(
      awayTeam.toLowerCase()
    )
  ) {
    targetTeam = awayTeam;
  }

  if (!targetTeam) {
    return null;
  }

  const innings = getInnings(
    scoreResponse
  );

  if (
    !Array.isArray(innings) ||
    !innings.length
  ) {
    return null;
  }

  const targetInning = innings.find(
    (inning) =>
      String(
        inning?.teamName ?? ""
      )
        .trim()
        .toLowerCase() ===
      targetTeam.toLowerCase()
  );

  if (!targetInning) {
    return null;
  }


  const conclusion = String(
    targetInning?.conclusion ?? ""
  )
    .trim()
    .toLowerCase();

  const inningsCompleted =
    conclusion === "completed" ||
    conclusion === "all out";

  const matchEnded =
    String(
      scoreResponse
        ?.timeline
        ?.match
        ?.status
        ?.shortName ?? ""
    )
      .trim()
      .toUpperCase() === "END";

  if (
    !inningsCompleted &&
    !matchEnded
  ) {
    return null;
  }

  const targetBatsmen =
    Array.isArray(
      targetInning?.batsmen
    )
      ? targetInning.batsmen
      : [];

  if (!targetBatsmen.length) {
    return null;
  }


  let ducks = 0;

  targetBatsmen.forEach(
    (batsman) => {
      const runs = toNumber(
        batsman?.runs
      );

      if (runs !== 0) {
        return;
      }

      if (
        batsman?.didNotBat === true
      ) {
        return;
      }

      const description = String(
        batsman?.description ?? ""
      )
        .trim()
        .toLowerCase();

      if (
        !description ||
        description === "not out"
      ) {
        return;
      }

      ducks++;
    }
  );

  const target = toNumber(
    parseSpecifier(fancy)?.total
  );

  if (target === null) {
    return null;
  }


  return findOverUnder(
    fancy,
    ducks > target
  );
}

  return null;
};



const saveWinnerResult = async (fancy, selectionId) => {
  try {
    const winner = getWinnerSelection(fancy, selectionId);

    if (!winner) {
      return null;
    }

    const result = await Fancy.updateOne(
      {
        id: String(fancy.id),
        eventId: String(fancy.eventId),
        apiSiteMarketId: String(fancy.apiSiteMarketId),
      },
      {
        $set: {
          winner: winner,
          sendStatus: "0",
        },
      },
    );

    if (result.matchedCount === 0) {
      console.log(`Winner update failed | id=${fancy.id}`);

      return null;
    }

    return winner;
  } catch (error) {
    console.error("saveWinnerResult error:", error?.stack || error);

    return null;
  }
};

// =====================================================
// RUNNING FANCY RESULT HELPERS
// =====================================================

const parseSpecifier = (fancy) => {
  const specifier = getSpecifier(fancy);

  if (!specifier) {
    return {};
  }

  try {
    return JSON.parse(specifier);
  } catch {
    return {};
  }
};

// -----------------------------------------------------
// GET PLAYER NAME FROM FANCY NAME
// -----------------------------------------------------

const getFancyPlayerName = (fancy) => {
  const name = String(fancy?.fancyName ?? "").trim();

  if (!name) {
    return null;
  }

  return name
    .replace(/^1st innings\s*-\s*/i, "")
    .replace(/\s+total$/i, "")
    .replace(/\s+to score.*$/i, "")
    .trim();
};

// -----------------------------------------------------
// FIND BATSMAN DYNAMICALLY
// -----------------------------------------------------

const findRunningBatsman = (fancy, scoreResponse) => {
  const batsmen = getAllBatsmen(scoreResponse);

  if (!batsmen.length) {
    return null;
  }

  const playerId = fancy?.data?.playerId ?? fancy?.playerId ?? null;

  const playerName =
    fancy?.data?.playerName ?? fancy?.playerName ?? getFancyPlayerName(fancy);

  const normalizedPlayerName = String(playerName ?? "")
    .trim()
    .toLowerCase();

  // First priority: PLAYER ID
  if (playerId) {
    const byId = batsmen.find(
      (batsman) => String(batsman?.playerId) === String(playerId),
    );

    if (byId) {
      return byId;
    }
  }

  // Second priority: exact / partial name
  if (normalizedPlayerName) {
    const byName = batsmen.find((batsman) => {
      const batsmanName = String(batsman?.batsmanName ?? "")
        .trim()
        .toLowerCase();

      if (!batsmanName) {
        return false;
      }

      return (
        batsmanName.includes(normalizedPlayerName) ||
        normalizedPlayerName.includes(batsmanName)
      );
    });

    if (byName) {
      return byName;
    }

    // Last name matching
    const lastName = normalizedPlayerName.split(",").pop()?.trim();

    if (lastName) {
      const byLastName = batsmen.find((batsman) => {
        const batsmanName = String(batsman?.batsmanName ?? "")
          .trim()
          .toLowerCase();

        return batsmanName.includes(lastName);
      });

      if (byLastName) {
        return byLastName;
      }
    }
  }

  return null;
};

// -----------------------------------------------------
// GET OVER DATA DYNAMICALLY
// -----------------------------------------------------

const getRunningOverData = (fancy, scoreResponse) => {
  const specifier = parseSpecifier(fancy);

  const overNumber = toNumber(specifier?.overnr);

  if (overNumber === null) {
    return null;
  }

  const score = getScoreObject(scoreResponse);

  const wormAndManhattan = score?.wormAndManhattan;

  if (!Array.isArray(wormAndManhattan)) {
    return null;
  }

  return (
    wormAndManhattan.find((item) => Number(item?.overNumber) === overNumber) ??
    null
  );
};

// -----------------------------------------------------
// GET INNINGS VALUE
// -----------------------------------------------------

const getInningsOverTotal = (overData, inningsKey) => {
  if (!overData) {
    return null;
  }

  const value = String(overData?.[inningsKey] ?? "").trim();

  if (!value) {
    return null;
  }

  const parts = value.split(",");

  // Format:
  // runs,wickets,total,wickets

  return toNumber(parts[2]);
};

// -----------------------------------------------------
// FIND YES/NO OR OVER/UNDER DYNAMICALLY
// -----------------------------------------------------

const findBooleanSelection = (fancy, result) => {
  const selections = getSelections(fancy);

  if (!selections.length) {
    return null;
  }

  const names = selections.map((selection) =>
    String(
      selection?.selectionName ??
        selection?.name ??
        selection?.apiSiteSelectionName ??
        "",
    )
      .trim()
      .toLowerCase(),
  );

  const hasYesNo = names.some((name) => name === "yes" || name === "no");

  if (hasYesNo) {
    return findYesNo(fancy, result);
  }

  const hasOverUnder = names.some(
    (name) => name.startsWith("over") || name.startsWith("under"),
  );

  if (hasOverUnder) {
    return findOverUnder(fancy, result);
  }

  return null;
};

const isBatsmanOut = (batsman) => {
  const description = String(batsman?.description || "").trim();

  return batsman?.didNotBat === false && description !== "";
};

const getActiveMatchByEventId = async (eventId) => {
  try {
    const matches = await getMatchesFromRedis();

    if (!Array.isArray(matches) || !matches.length) {
      return null;
    }

    const match = matches.find(
      (item) =>
        String(item?.eventId || "").trim() === String(eventId || "").trim(),
    );

    return match || null;
  } catch (error) {
    console.error("getActiveMatchByEventId error:", error?.message || error);

    return null;
  }
};

// =====================================================
// DYNAMIC RUNNING RESULT
// =====================================================

const calculateRunningFancyResult = async (fancy, scoreResponse) => {

  const marketId = String(fancy?.apiSiteMarketId ?? "").trim();

  if (!marketId) {
    return null;
  }

  const score = getScoreObject(scoreResponse);

  if (!score) {
    return null;
  }

  const innings = getInnings(scoreResponse);

  const batsmen = getAllBatsmen(scoreResponse);

  // 356 / 357 - Innings over total

  if (marketId === "356" || marketId === "357") {
    const specifier = parseSpecifier(fancy);

    const overNumber = toNumber(specifier?.overnr);

    const target = toNumber(specifier?.total);

    if (overNumber === null || target === null) {
      return null;
    }

    const match = await getActiveMatchByEventId(fancy?.eventId);

    if (!match) {
      return null;
    }

    const homeTeam = String(match?.homeTeam ?? "").trim();

    const awayTeam = String(match?.awayTeam ?? "").trim();

    if (!homeTeam && !awayTeam) {
      return null;
    }

    const fancyName = String(fancy?.fancyName ?? "")
      .trim()
      .toLowerCase();

    let targetTeam = null;

    if (homeTeam && fancyName.includes(homeTeam.toLowerCase())) {
      targetTeam = homeTeam;
    } else if (awayTeam && fancyName.includes(awayTeam.toLowerCase())) {
      targetTeam = awayTeam;
    }

    if (!targetTeam) {
      return null;
    }

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (!innings.length) {
      return null;
    }

    const targetInningIndex = innings.findIndex(
      (inning) =>
        String(inning?.teamName ?? "")
          .trim()
          .toLowerCase() === targetTeam.toLowerCase(),
    );

    if (targetInningIndex === -1) {
      return null;
    }

    const targetInning = innings[targetInningIndex];

    const wormAndManhattan = score?.wormAndManhattan;

    if (!Array.isArray(wormAndManhattan)) {
      return null;
    }

    const overData = wormAndManhattan.find(
      (item) => toNumber(item?.overNumber) === overNumber,
    );

    if (!overData) {
      return null;
    }

    let inningsKey = null;

    if (targetInningIndex === 0) {
      inningsKey = "firstInnings";
    } else if (targetInningIndex === 1) {
      inningsKey = "secondInnings";
    }

    if (!inningsKey) {
      return null;
    }

    const inningsData = overData?.[inningsKey];

    if (
      inningsData === undefined ||
      inningsData === null ||
      String(inningsData).trim() === ""
    ) {
      return null;
    }

    const inningsParts = String(inningsData)
      .split(",")
      .map((item) => item.trim());

    const total = toNumber(inningsParts[0]);

    if (total === null) {
      return null;
    }

    const nextOverExists = wormAndManhattan.some(
      (item) => toNumber(item?.overNumber) === overNumber + 1,
    );

    const conclusion = String(targetInning?.conclusion ?? "")
      .trim()
      .toLowerCase();

    const inningsCompleted =
      conclusion === "completed" || conclusion === "all out";

    const matchStatus = String(
      scoreResponse?.timeline?.match?.status?.shortName ?? "",
    )
      .trim()
      .toUpperCase();

    const matchCompleted = matchStatus === "END";

    if (!nextOverExists && !inningsCompleted && !matchCompleted) {
      return null;
    }

    const isOver = total > target;
    return findOverUnder(fancy, isOver);
  }

  // ===================================================
  // 638
  // PLAYER TOTAL
  // ===================================================

  if (marketId === "638") {
    const specifier = parseSpecifier(fancy);

    const target = toNumber(specifier?.total);
    const playerId = String(specifier?.player || "").trim();

    if (target === null || !playerId) {
      return null;
    }

    const score = getScoreObject(scoreResponse);

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (!innings.length) {
      return null;
    }

    // Current event ka active match Redis se lo
    const match = await getActiveMatchByEventId(fancy?.eventId);

    if (!match) {
      return null;
    }

    const homeTeam = String(match?.homeTeam || "").trim();

    const awayTeam = String(match?.awayTeam || "").trim();

    if (!homeTeam && !awayTeam) {
      return null;
    }

    // Player jis team ke liye batting kar raha hai
    const targetInning = innings.find((inning) => {
      const teamName = String(inning?.teamName || "").trim();

      if (!teamName) {
        return false;
      }

      const isHomeTeam =
        homeTeam && teamName.toLowerCase() === homeTeam.toLowerCase();

      const isAwayTeam =
        awayTeam && teamName.toLowerCase() === awayTeam.toLowerCase();

      if (!isHomeTeam && !isAwayTeam) {
        return false;
      }

      const batsmen = Array.isArray(inning?.batsmen) ? inning.batsmen : [];

      return batsmen.some(
        (batsman) => String(batsman?.playerId || "").trim() === playerId,
      );
    });

    if (!targetInning) {
      return null;
    }

    const batsmen = Array.isArray(targetInning?.batsmen)
      ? targetInning.batsmen
      : [];

    const player = batsmen.find(
      (batsman) => String(batsman?.playerId || "").trim() === playerId,
    );

    if (!player) {
      return null;
    }

    const runs = toNumber(player?.runs);

    if (runs === null) {
      return null;
    }

    // Player OUT check
    const description = String(player?.description || "")
      .trim()
      .toLowerCase();

    const playerOut =
      player?.didNotBat === false &&
      description !== "" &&
      description !== "not out";

    const matchEnded = isMatchCompleted(scoreResponse);

    if (!playerOut && !matchEnded) {
      return null;
    }

    return findOverUnder(fancy, runs > target);
  }

  // 641 / 642
  // OVER N HOME / AWAY TEAM DISMISSAL

  if (marketId === "641" || marketId === "642") {
    const specifier = parseSpecifier(fancy);

    const overNumber = toNumber(specifier?.overnr);

    if (overNumber === null) {
      return null;
    }

    const matches = await getMatchesFromRedis();

    if (!Array.isArray(matches)) {
      return null;
    }

    const match = matches.find(
      (item) => String(item?.eventId) === String(fancy?.eventId),
    );

    if (!match) {
      return null;
    }

    const homeTeam = String(match?.homeTeam ?? "").trim();

    const awayTeam = String(match?.awayTeam ?? "").trim();

    if (!homeTeam || !awayTeam) {
      return null;
    }

    const fancyName = String(fancy?.fancyName ?? "")
      .trim()
      .toLowerCase();

    let targetTeam = null;

    if (fancyName.includes(homeTeam.toLowerCase())) {
      targetTeam = homeTeam;
    } else if (fancyName.includes(awayTeam.toLowerCase())) {
      targetTeam = awayTeam;
    }

    if (!targetTeam) {
      return null;
    }

    const score = getScoreObject(scoreResponse);

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (!innings.length) {
      return null;
    }

    const targetInningIndex = innings.findIndex(
      (inning) =>
        String(inning?.teamName ?? "")
          .trim()
          .toLowerCase() === targetTeam.toLowerCase(),
    );

    if (targetInningIndex !== 0 && targetInningIndex !== 1) {
      return null;
    }

    const targetInning = innings[targetInningIndex];

    const wormAndManhattan = score?.wormAndManhattan;

    if (!Array.isArray(wormAndManhattan)) {
      return null;
    }

    const inningsKey =
      targetInningIndex === 0 ? "firstInnings" : "secondInnings";

    const overData = wormAndManhattan.find(
      (item) => toNumber(item?.overNumber) === overNumber,
    );

    if (!overData) {
      return null;
    }

    const inningsData = overData?.[inningsKey];

    if (inningsData === undefined || inningsData === null) {
      return null;
    }

    const parts = String(inningsData)
      .split(",")
      .map((item) => item.trim());

    const wickets = toNumber(parts[1]);

    if (wickets === null) {
      return null;
    }

    const nextOverData = wormAndManhattan.find(
      (item) => toNumber(item?.overNumber) === overNumber + 1,
    );

    const nextOverExists = !!nextOverData;

    const conclusion = String(targetInning?.conclusion ?? "")
      .trim()
      .toLowerCase();

    const inningsCompleted =
      conclusion === "completed" || conclusion === "all out";

    const matchStatus = String(
      scoreResponse?.timeline?.match?.status?.shortName ?? "",
    )
      .trim()
      .toUpperCase();

    const matchCompleted = matchStatus === "END";

    if (!nextOverExists && !inningsCompleted && !matchCompleted) {
      return null;
    }


    return findBooleanSelection(fancy, wickets > 0);
  }

  // 662
  // PLAYER TO SCORE 50 / TARGET

  if (marketId === "662") {
    const specifierData = parseSpecifier(fancy);

    const playerId = String(specifierData?.player || "").trim();

    const milestone = toNumber(specifierData?.milestone);

    if (!playerId || milestone === null) {
      return null;
    }

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (!innings.length) {
      return null;
    }

    const targetInning = innings.find((inning) => {
      const batsmen = Array.isArray(inning?.batsmen) ? inning.batsmen : [];

      return batsmen.some(
        (batsman) => String(batsman?.playerId || "").trim() === playerId,
      );
    });

    if (!targetInning) {
      return null;
    }

    const batsmen = Array.isArray(targetInning?.batsmen)
      ? targetInning.batsmen
      : [];

    if (!batsmen.length) {
      return null;
    }

    // FIND TARGET PLAYER

    const player = batsmen.find(
      (batsman) => String(batsman?.playerId || "").trim() === playerId,
    );

    if (!player) {
      return null;
    }

    // PLAYER RUNS

    const runs = toNumber(player?.runs);

    if (runs === null) {
      return null;
    }

    const description = String(player?.description || "")
      .trim()
      .toLowerCase();

    const playerOut =
      player?.didNotBat === false &&
      description !== "" &&
      description !== "not out";

    const matchEnded = isMatchCompleted(scoreResponse);

    if (!playerOut && !matchEnded) {
      return null;
    }

    return findYesNo(fancy, runs >= milestone);
  }

  if (marketId === "646") {
    const specifier = parseSpecifier(fancy);

    const dismissalNumber = toNumber(specifier?.dismissalnr);

    if (dismissalNumber === null || dismissalNumber <= 0) {
      return null;
    }

    const score = getScoreObject(scoreResponse);

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (innings.length < 2) {
      return null;
    }

    const getDismissalScore = (inning) => {
      const fallOfwickets = String(inning?.fallOfwickets ?? "").trim();

      if (!fallOfwickets) {
        return null;
      }

      const dismissals = fallOfwickets
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const dismissal = dismissals.find((item) => {
        const scorePart = item.split(" ").find((part) => part.includes("/"));

        if (!scorePart) {
          return false;
        }

        const wicketNumber = toNumber(scorePart.split("/")[1]);

        return wicketNumber === dismissalNumber;
      });

      if (!dismissal) {
        return null;
      }

      const scorePart = dismissal.split(" ").find((part) => part.includes("/"));

      if (!scorePart) {
        return null;
      }

      const score = toNumber(scorePart.split("/")[0]);

      if (score === null) {
        return null;
      }

      return score;
    };

    const firstScore = getDismissalScore(innings[0]);

    const secondScore = getDismissalScore(innings[1]);

    if (firstScore === null || secondScore === null) {
      return null;
    }

    if (firstScore === secondScore) {
      return findSelection(
        fancy,
        (selection) =>
          String(selection?.selectionName ?? "")
            .trim()
            .toLowerCase() === "draw",
      );
    }

    if (firstScore > secondScore) {
      return findTeamSelection(fancy, innings[0]?.teamName);
    }

    return findTeamSelection(fancy, innings[1]?.teamName);
  }

  // ===================================================
  // 694
  // COIN TOSS WINNER
  // ===================================================
  if (marketId === "694") {

    const tossWinner = String(
      scoreResponse?.timeline?.match?.coinToss?.winner ?? "",
    )
      .trim()
      .toLowerCase();

    if (!tossWinner) {
      return null;
    }

    if (tossWinner !== "home" && tossWinner !== "away") {
      return null;
    }

    const teamName = String(
      scoreResponse?.timeline?.match?.teams?.[tossWinner]?.name ?? "",
    ).trim();

    if (!teamName) {
      return null;
    }

    const selections = getSelections(fancy);

    

    if (!selections.length) {
      return null;
    }

    const winnerSelection = selections.find((selection) => {
      const selectionName = String(selection?.selectionName ?? "").trim();

      return selectionName.toLowerCase() === teamName.toLowerCase();
    });

    if (!winnerSelection) {
      return null;
    }

    return winnerSelection;
  }

  if (marketId === "359" || marketId === "360") {
    const specifier = parseSpecifier(fancy);

    const overNumber = toNumber(specifier?.overnr);

    if (overNumber === null) {
      return null;
    }

    const match = await getActiveMatchByEventId(fancy?.eventId);
    if (!match) return null;

    const homeTeam = String(match?.homeTeam ?? "").trim();
    const awayTeam = String(match?.awayTeam ?? "").trim();

    if (!homeTeam && !awayTeam) {
      return null;
    }

    const fancyName = String(fancy?.fancyName ?? "")
      .trim()
      .toLowerCase();

    let targetTeam = null;

    if (homeTeam && fancyName.includes(homeTeam.toLowerCase())) {
      targetTeam = homeTeam;
    } else if (awayTeam && fancyName.includes(awayTeam.toLowerCase())) {
      targetTeam = awayTeam;
    }

    if (!targetTeam) {
      return null;
    }

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (!innings.length) {
      return null;
    }

    const targetInningIndex = innings.findIndex(
      (inning) =>
        String(inning?.teamName ?? "")
          .trim()
          .toLowerCase() === targetTeam.toLowerCase(),
    );

    if (targetInningIndex === -1) {
      return null;
    }

    let inningsKey = null;

    if (targetInningIndex === 0) {
      inningsKey = "firstInnings";
    } else if (targetInningIndex === 1) {
      inningsKey = "secondInnings";
    }

    if (!inningsKey) {
      return null;
    }

    const wormAndManhattan = score?.wormAndManhattan;

    if (!Array.isArray(wormAndManhattan)) {
      return null;
    }

    const overData = wormAndManhattan.find(
      (item) => toNumber(item?.overNumber) === overNumber,
    );

    if (!overData) {
      return null;
    }

    const inningsData = overData?.[inningsKey];

    if (
      inningsData === undefined ||
      inningsData === null ||
      String(inningsData).trim() === ""
    ) {
      return null;
    }

    const inningsParts = String(inningsData)
      .split(",")
      .map((item) => item.trim());

    const total = toNumber(inningsParts[0]);

    if (total === null) {
      return null;
    }

    const nextOverExists = wormAndManhattan.some(
      (item) => toNumber(item?.overNumber) === overNumber + 1,
    );

    const targetInning = innings[targetInningIndex];

    const conclusion = String(targetInning?.conclusion ?? "")
      .trim()
      .toLowerCase();

    const inningsCompleted =
      conclusion === "completed" || conclusion === "all out";

    const matchStatus = String(
      scoreResponse?.timeline?.match?.status?.shortName ?? "",
    )
      .trim()
      .toUpperCase();

    const matchCompleted = matchStatus === "END";

    if (!nextOverExists && !inningsCompleted && !matchCompleted) {
      return null;
    }

    const resultName = total % 2 === 0 ? "even" : "odd";

    const selection = findSelection(
      fancy,
      (item) =>
        String(item?.selectionName ?? "")
          .trim()
          .toLowerCase() === resultName,
    );

    if (!selection) {
      return null;
    }

    return selection;
  }

  if (marketId === "362" || marketId === "363") {
    const specifier = parseSpecifier(fancy);

    const overNumber = toNumber(specifier?.overnr);
    const deliveryNumber = toNumber(specifier?.deliverynr);
    const target = toNumber(specifier?.total);

    if (overNumber === null || deliveryNumber === null || target === null) {
      return null;
    }

    const match = await getActiveMatchByEventId(fancy?.eventId);

    if (!match) {
      return null;
    }

    const homeTeam = String(match?.homeTeam ?? "").trim();

    const awayTeam = String(match?.awayTeam ?? "").trim();

    if (!homeTeam && !awayTeam) {
      return null;
    }

    const fancyName = String(fancy?.fancyName ?? "")
      .trim()
      .toLowerCase();

    let targetTeam = null;

    if (homeTeam && fancyName.includes(homeTeam.toLowerCase())) {
      targetTeam = homeTeam;
    } else if (awayTeam && fancyName.includes(awayTeam.toLowerCase())) {
      targetTeam = awayTeam;
    }

    if (!targetTeam) {
      return null;
    }

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (!innings.length) {
      return null;
    }

    const targetInningIndex = innings.findIndex(
      (inning) =>
        String(inning?.teamName ?? "")
          .trim()
          .toLowerCase() === targetTeam.toLowerCase(),
    );

    if (targetInningIndex === -1) {
      return null;
    }

    let inningsKey = null;

    if (targetInningIndex === 0) {
      inningsKey = "firstInnings";
    } else if (targetInningIndex === 1) {
      inningsKey = "secondInnings";
    }

    if (!inningsKey) {
      return null;
    }

    const ballByBallSummaries = Array.isArray(score?.ballByBallSummaries)
      ? score.ballByBallSummaries
      : [];

    if (!ballByBallSummaries.length) {
      return null;
    }

    const overData = ballByBallSummaries.find(
      (item) => toNumber(item?.overNumber) === overNumber,
    );

    if (!overData) {
      return null;
    }

    const deliveryString = String(overData?.[inningsKey] ?? "").trim();

    if (!deliveryString) {
      return null;
    }

    const deliveries = deliveryString
      .split(",")
      .map((item) => String(item).trim())
      .filter((item) => item !== "");

    const delivery = deliveries[deliveryNumber - 1];

    if (delivery === undefined) {
      return null;
    }

    const numericMatch = String(delivery).match(/^\d+/);

    const actualRuns = numericMatch ? Number(numericMatch[0]) : 0;

    const nextOverExists = ballByBallSummaries.some(
      (item) => toNumber(item?.overNumber) === overNumber + 1,
    );

    const targetInning = innings[targetInningIndex];

    const conclusion = String(targetInning?.conclusion ?? "")
      .trim()
      .toLowerCase();

    const inningsCompleted =
      conclusion === "completed" || conclusion === "all out";

    const matchStatus = String(
      scoreResponse?.timeline?.match?.status?.shortName ?? "",
    )
      .trim()
      .toUpperCase();

    const matchCompleted = matchStatus === "END";

    if (!nextOverExists && !inningsCompleted && !matchCompleted) {
      return null;
    }

    const isOver = actualRuns > target;

    return findOverUnder(fancy, isOver);
  }

  if (marketId === "645") {
    const specifier = parseSpecifier(fancy);

    const overNumber = toNumber(specifier?.overnr);

    if (overNumber === null) {
      return null;
    }

    const match = await getActiveMatchByEventId(fancy?.eventId);

    if (!match) {
      return null;
    }

    const homeTeam = String(match?.homeTeam ?? "").trim();
    const awayTeam = String(match?.awayTeam ?? "").trim();

    if (!homeTeam || !awayTeam) {
      return null;
    }

    const wormAndManhattan = score?.wormAndManhattan;

    if (!Array.isArray(wormAndManhattan)) {
      return null;
    }

    const overData = wormAndManhattan.find(
      (item) => toNumber(item?.overNumber) === overNumber,
    );

    if (!overData) {
      return null;
    }

    const firstInningsData = overData?.firstInnings;
    const secondInningsData = overData?.secondInnings;

    if (
      firstInningsData === undefined ||
      firstInningsData === null ||
      String(firstInningsData).trim() === "" ||
      secondInningsData === undefined ||
      secondInningsData === null ||
      String(secondInningsData).trim() === ""
    ) {
      return null;
    }

    const firstParts = String(firstInningsData)
      .split(",")
      .map((item) => item.trim());

    const secondParts = String(secondInningsData)
      .split(",")
      .map((item) => item.trim());

    const firstRuns = toNumber(firstParts[0]);
    const secondRuns = toNumber(secondParts[0]);

    if (firstRuns === null || secondRuns === null) {
      return null;
    }

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (innings.length < 2) {
      return null;
    }

    const firstInningsTeam = String(innings?.[0]?.teamName ?? "").trim();

    const secondInningsTeam = String(innings?.[1]?.teamName ?? "").trim();

    if (!firstInningsTeam || !secondInningsTeam) {
      return null;
    }

    let homeRuns = null;
    let awayRuns = null;

    if (firstInningsTeam.toLowerCase() === homeTeam.toLowerCase()) {
      homeRuns = firstRuns;
    } else if (firstInningsTeam.toLowerCase() === awayTeam.toLowerCase()) {
      awayRuns = firstRuns;
    }

    if (secondInningsTeam.toLowerCase() === homeTeam.toLowerCase()) {
      homeRuns = secondRuns;
    } else if (secondInningsTeam.toLowerCase() === awayTeam.toLowerCase()) {
      awayRuns = secondRuns;
    }

    if (homeRuns === null || awayRuns === null) {
      return null;
    }

    const nextOverExists = wormAndManhattan.some(
      (item) => toNumber(item?.overNumber) === overNumber + 1,
    );

    const matchStatus = String(
      scoreResponse?.timeline?.match?.status?.shortName ?? "",
    )
      .trim()
      .toUpperCase();

    const matchCompleted = matchStatus === "END";

    const homeInning = innings.find(
      (inning) =>
        String(inning?.teamName ?? "")
          .trim()
          .toLowerCase() === homeTeam.toLowerCase(),
    );

    const awayInning = innings.find(
      (inning) =>
        String(inning?.teamName ?? "")
          .trim()
          .toLowerCase() === awayTeam.toLowerCase(),
    );

    const homeConclusion = String(homeInning?.conclusion ?? "")
      .trim()
      .toLowerCase();

    const awayConclusion = String(awayInning?.conclusion ?? "")
      .trim()
      .toLowerCase();

    const inningsCompleted =
      homeConclusion === "completed" ||
      homeConclusion === "all out" ||
      awayConclusion === "completed" ||
      awayConclusion === "all out";

    if (!nextOverExists && !inningsCompleted && !matchCompleted) {
      return null;
    }

    let winningTeam = null;

    if (homeRuns > awayRuns) {
      winningTeam = homeTeam;
    } else if (awayRuns > homeRuns) {
      winningTeam = awayTeam;
    } else {
      winningTeam = "draw";
    }

    const selection = findSelection(
      fancy,
      (item) =>
        String(item?.selectionName ?? "")
          .trim()
          .toLowerCase() === winningTeam.toLowerCase(),
    );

    if (!selection) {
      return null;
    }

    return selection;
  }

  if (marketId === "651") {
    const specifier = parseSpecifier(fancy);

    const playerId = String(specifier?.player ?? "").trim();

    if (!playerId) {
      return null;
    }

    const match = await getActiveMatchByEventId(fancy?.eventId);

    if (!match) {
      return null;
    }

    const homeTeam = String(match?.homeTeam ?? "").trim();
    const awayTeam = String(match?.awayTeam ?? "").trim();

    if (!homeTeam || !awayTeam) {
      return null;
    }

    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (!innings.length) {
      return null;
    }

    const playerInning = innings.find((inning) => {
      const teamName = String(inning?.teamName ?? "").trim();

      const isHomeTeam = teamName.toLowerCase() === homeTeam.toLowerCase();

      const isAwayTeam = teamName.toLowerCase() === awayTeam.toLowerCase();

      if (!isHomeTeam && !isAwayTeam) {
        return false;
      }

      const batsmen = Array.isArray(inning?.batsmen) ? inning.batsmen : [];

      return batsmen.some(
        (batsman) => String(batsman?.playerId ?? "").trim() === playerId,
      );
    });

    if (!playerInning) {
      return null;
    }

    const batsmen = Array.isArray(playerInning?.batsmen)
      ? playerInning.batsmen
      : [];

    const player = batsmen.find(
      (batsman) => String(batsman?.playerId ?? "").trim() === playerId,
    );

    if (!player) {
      return null;
    }

    const dismissalType = String(player?.description ?? "")
      .trim()
      .toLowerCase();

    if (!dismissalType || dismissalType === "not out") {
      return null;
    }

    const selection = findSelection(
      fancy,
      (item) =>
        String(item?.selectionName ?? "")
          .trim()
          .toLowerCase() === dismissalType,
    );

    if (!selection) {
      return null;
    }

    return selection;
  }

if (marketId === "816" || marketId === "817") {

  const specifier = parseSpecifier(fancy);

  const dismissalNumber = toNumber(
    specifier?.dismissalnr
  );

  if (!dismissalNumber || dismissalNumber < 1) {
    return null;
  }

  const match = await getActiveMatchByEventId(
    fancy?.eventId
  );


  if (!match) {
    return null;
  }

  const homeTeam = String(
    match?.homeTeam ?? ""
  ).trim();

  const awayTeam = String(
    match?.awayTeam ?? ""
  ).trim();

  const fancyName = String(
    fancy?.fancyName ?? ""
  ).trim();

 

  if (!homeTeam || !awayTeam || !fancyName) {
    return null;
  }



  let targetTeam = null;

  if (
    fancyName
      .toLowerCase()
      .includes(homeTeam.toLowerCase())
  ) {
    targetTeam = homeTeam;
  } else if (
    fancyName
      .toLowerCase()
      .includes(awayTeam.toLowerCase())
  ) {
    targetTeam = awayTeam;
  }

  if (!targetTeam) {
    return null;
  }

  const innings = Array.isArray(score?.innings)
    ? score.innings
    : [];

  const targetInning = innings.find(
    (inning) =>
      String(inning?.teamName ?? "")
        .trim()
        .toLowerCase() ===
      targetTeam.toLowerCase()
  );

  if (!targetInning) {
    return null;
  }

  const fallOfwickets = String(
    targetInning?.fallOfwickets ?? ""
  ).trim();

  if (!fallOfwickets) {
    return null;
  }


  const dismissalEntries = [];

  const dismissalRegex =
    /(?:^|,\s*)(.+?)\s+(\d+\/\d+)\s+\(([^)]+)\)/g;

  let dismissalMatch;

  while (
    (dismissalMatch =
      dismissalRegex.exec(
        fallOfwickets
      )) !== null
  ) {
    dismissalEntries.push({
      playerName:
        dismissalMatch[1].trim(),

      score:
        dismissalMatch[2],

      over:
        dismissalMatch[3],
    });
  }

  const targetDismissal =
    dismissalEntries[
      dismissalNumber - 1
    ];

  if (!targetDismissal) {
    return null;
  }

  const playerName = String(
    targetDismissal?.playerName ?? ""
  )
    .replace(/^,\s*/, "")
    .trim();

  if (!playerName) {
    return null;
  }

  const batsmen = Array.isArray(
    targetInning?.batsmen
  )
    ? targetInning.batsmen
    : [];

  if (!batsmen.length) {
    return null;
  }

  const targetBatsman = batsmen.find(
    (batsman) =>
      String(
        batsman?.batsmanName ?? ""
      )
        .trim()
        .toLowerCase() ===
      playerName.toLowerCase()
  );

  if (!targetBatsman) {
    return null;
  }

  const dismissalType = String(
    targetBatsman?.description ?? ""
  )
    .trim()
    .toLowerCase();

  if (
    !dismissalType ||
    dismissalType === "not out"
  ) {
    return null;
  }

  const selection = findSelection(
    fancy,
    (item) =>
      String(
        item?.selectionName ?? ""
      )
        .trim()
        .toLowerCase() ===
      dismissalType
  );

  if (!selection) {
    return null;
  }

  return selection;
}

if (marketId === "1229" || marketId === "1230") {

  const specifier = parseSpecifier(fancy);
  const overNumber = toNumber(
    specifier?.overnr
  );

  const total = toNumber(
    specifier?.total
  );

  if (
    overNumber === null ||
    total === null ||
    overNumber < 0
  ) {
    return null;
  }

  const match = await getActiveMatchByEventId(
    fancy?.eventId
  );

  if (!match) {
    return null;
  }

  const homeTeam = String(
    match?.homeTeam ?? ""
  ).trim();

  const awayTeam = String(
    match?.awayTeam ?? ""
  ).trim();

  const fancyName = String(
    fancy?.fancyName ?? ""
  ).trim();


  if (
    !homeTeam ||
    !awayTeam ||
    !fancyName
  ) {
    return null;
  }

  let targetTeam = null;

  if (
    fancyName
      .toLowerCase()
      .includes(homeTeam.toLowerCase())
  ) {
    targetTeam = homeTeam;
  } else if (
    fancyName
      .toLowerCase()
      .includes(awayTeam.toLowerCase())
  ) {
    targetTeam = awayTeam;
  }

  if (!targetTeam) {
    return null;
  }

  const innings = Array.isArray(
    score?.innings
  )
    ? score.innings
    : [];

  const targetInning = innings.find(
    (inning) =>
      String(inning?.teamName ?? "")
        .trim()
        .toLowerCase() ===
      targetTeam.toLowerCase()
  );

  if (!targetInning) {
    return null;
  }

  const currentRuns = toNumber(
    targetInning?.runs
  );

  const currentOvers = String(
    targetInning?.overs ?? ""
  ).trim();

  if (currentRuns === null) {
    return null;
  }

  const completedOvers =
    Number.parseInt(
      currentOvers,
      10
    );

  if (
    Number.isNaN(completedOvers)
  ) {
    return null;
  }

  const inningsCompleted =
    String(
      targetInning?.conclusion ?? ""
    )
      .trim()
      .toLowerCase() ===
    "completed";

  const matchEnded =
    String(
      scoreResponse?.timeline?.match?.status
        ?.shortName ?? ""
    )
      .trim()
      .toUpperCase() ===
    "END";

  if (
    completedOvers < overNumber &&
    !inningsCompleted &&
    !matchEnded
  ) {
    return null;
  }

  let winner = null;

  if (currentRuns > total) {
    winner = "over";
  } else {
    winner = "under";
  }

 const selection = findSelection(
  fancy,
  (item) => {
    const selectionName = String(
      item?.selectionName ?? ""
    )
      .trim()
      .toLowerCase();

    return selectionName.startsWith(
      `${winner} `
    );
  }
);

  if (!selection) {
    return null;
  }

  return selection;
}

  if (marketId === "877" || marketId === "878") {
    const specifier = parseSpecifier(fancy);

    const total = toNumber(specifier?.total);

    if (total === null) {
      return null;
    }

    const match = await getActiveMatchByEventId(fancy?.eventId);

    if (!match) {
      return null;
    }

    const homeTeam = String(match?.homeTeam ?? "").trim();

    const awayTeam = String(match?.awayTeam ?? "").trim();

    const fancyName = String(fancy?.fancyName ?? "").trim();

    if (!homeTeam || !awayTeam || !fancyName) {
      return null;
    }

    // Team dynamically identify
    let targetTeam = null;

    if (fancyName.toLowerCase().includes(homeTeam.toLowerCase())) {
      targetTeam = homeTeam;
    } else if (fancyName.toLowerCase().includes(awayTeam.toLowerCase())) {
      targetTeam = awayTeam;
    }

    if (!targetTeam) {
      return null;
    }

    // Redis innings
    const innings = Array.isArray(score?.innings) ? score.innings : [];

    if (!innings.length) {
      return null;
    }

    // Team name se innings find
    const targetInning = innings.find(
      (inning) =>
        String(inning?.teamName ?? "")
          .trim()
          .toLowerCase() === targetTeam.toLowerCase(),
    );

    if (!targetInning) {
      return null;
    }

    // Innings Completed / All Out check
    const conclusion = String(targetInning?.conclusion ?? "")
      .trim()
      .toLowerCase();

    if (conclusion !== "completed" && conclusion !== "all out") {
      return null;
    }

    // Match END check
    const matchStatus = String(
      scoreResponse?.timeline?.match?.status?.shortName ?? "",
    )
      .trim()
      .toUpperCase();

    if (matchStatus !== "END") {
      return null;
    }

    // Actual Redis runs
    const teamRuns = toNumber(targetInning?.runs);

    if (teamRuns === null) {
      return null;
    }

    let resultType = null;

    if (teamRuns > total) {
      resultType = "over";
    } else if (teamRuns < total) {
      resultType = "under";
    } else {
      return null;
    }

    // Selection dynamically find
    const selection = findSelection(
      fancy,
      (item) =>
        String(item?.selectionName ?? "")
          .trim()
          .toLowerCase() === `${resultType} ${total}`,
    );

    if (!selection) {
      return null;
    }

    return selection;
  }

  return null;
};


const processMatchResult = async (
  eventId,
  sportId,
  type = "completed"
) => {
  try {
    const scoreKey = getScoreRedisKey(
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


    if (type === "completed") {

      const completed =
        isMatchCompleted(scoreResponse);

      if (!completed) {
        return [];
      }
    }

    const fancies = await Fancy.find({
      eventId: String(eventId),
      sportId: sportId,
    }).lean();

    if (
      !Array.isArray(fancies) ||
      !fancies.length
    ) {
      return [];
    }

    const results = [];

    for (const fancy of fancies) {
      try {

        const marketId = String(
          fancy?.apiSiteMarketId ?? ""
        );

        if (!marketId) {
          continue;
        }

        let selection = null;

        if (type === "running") {

          selection =
            await calculateRunningFancyResult(
              fancy,
              scoreResponse
            );

        } else if (
          type === "inningComplete"
        ) {

          selection =
            await calculateInningCompleteFancyResult(
              fancy,
              scoreResponse
            );

        } else if (
          type === "completed"
        ) {

          selection =
            await calculateFancyResult(
              fancy,
              scoreResponse
            );
        }

        if (!selection) {
          continue;
        }

        const selectionId =
          selection?.apiSiteSelectionId ??
          selection;

        if (!selectionId) {
          continue;
        }

        const winner =
          await saveWinnerResult(
            fancy,
            selectionId
          );

        if (!winner) {
          continue;
        }

        results.push({
          eventId: String(eventId),
          sportId: sportId,
          apiSiteMarketId:
            marketId,
          apiSiteSelectionId:
            String(
              winner.apiSiteSelectionId
            ),
          fancyName:
            fancy?.fancyName ?? null,
          winner,
        });

      } catch (fancyError) {

        console.error(
          `Fancy result calculation error | eventId=${eventId} | market=${fancy?.apiSiteMarketId}`,
          fancyError?.stack ||
            fancyError
        );
      }
    }

    return results;

  } catch (error) {

    console.error(
      "processMatchResult error:",
      error?.stack || error
    );

    return [];
  }
};

const processSingleMatchResult = async (eventId, sportId) => {
  return processMatchResult(eventId, sportId, "completed");
};

const processRunningMatchResult = async (eventId, sportId) => {
  return processMatchResult(eventId, sportId, "running");
};

const processInningCompleteMatchResult = async (eventId, sportId) => {
  return processMatchResult(eventId, sportId, "inningComplete");
};

const processAllFancyResults = async () => {
  try {
    const matches = await getMatchesFromRedis();

    if (!Array.isArray(matches)) {
      return [];
    }

    const cricketMatches = matches.filter(
      (match) => Number(match?.sportId) === 4,
    );

    const allResults = [];

    for (const match of cricketMatches) {
      // COMPLETED
      const completedResults = await processSingleMatchResult(
        match.eventId,
        match.sportId,
      );

      // INNING COMPLETE
      const inningCompleteResults = await processInningCompleteMatchResult(
        match.eventId,
        match.sportId,
      );

      if (
        Array.isArray(inningCompleteResults) &&
        inningCompleteResults.length
      ) {
        allResults.push(...inningCompleteResults);
      }

      if (Array.isArray(completedResults) && completedResults.length) {
        allResults.push(...completedResults);
      }

      // RUNNING
      const runningResults = await processRunningMatchResult(
        match.eventId,
        match.sportId,
      );

      if (Array.isArray(runningResults) && runningResults.length) {
        allResults.push(...runningResults);
      }
    }

    return allResults;
  } catch (error) {
    console.error("processAllFancyResults error:", error?.stack || error);

    return [];
  }
};




module.exports = {
  processSingleMatchResult,
  processRunningMatchResult,
  processAllFancyResults,
  calculateFancyResult,
  calculateRunningFancyResult,
  isMatchCompleted,
};
