
const Match = require("../models/matchModel");

const getMatches = async (filters = {}) => {
  try {
    const {
      sportId,
      isResult,
      matchType,
      search,
      limit = 100,
    } = filters;

    const query = {
      isOld: false,
    };

    // Sport filter
    if (sportId !== undefined && sportId !== null && sportId !== "") {
      query.sportId = Number(sportId);
    }

    // Result filter
    if (isResult !== undefined && isResult !== null && isResult !== "") {
      query.isResult =
        String(isResult).toLowerCase() === "true";
    }

    // Match type filter
    if (matchType !== undefined && matchType !== null && matchType !== "") {
      query.matchType = matchType;
    }

    // Search filter
    if (
      search !== undefined &&
      search !== null &&
      String(search).trim() !== ""
    ) {
      const searchText = String(search).trim();

      query.$or = [
        {
          eventName: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          competitionName: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          homeTeam: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          awayTeam: {
            $regex: searchText,
            $options: "i",
          },
        },
      ];
    }

    // Maximum 100
    const currentLimit = Math.min(
      Math.max(parseInt(limit, 10) || 100, 1),
      100
    );

    const [matches, total] = await Promise.all([
      Match.find(query)
        .sort({
          openDate: 1,
        })
        .limit(currentLimit)
        .lean(),

      Match.countDocuments(query),
    ]);

    return {
      matches,
      total,
      limit: currentLimit,
    };
  } catch (error) {
    console.error("❌ Match service getMatches error:", error);
    throw error;
  }
};



const getOldMatches = async (filters = {}) => {
  try {
    const {
      sportId,
      isResult,
      matchType,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const query = {
      isOld: true,
    };

    if (sportId !== undefined && sportId !== null && sportId !== "") {
      query.sportId = Number(sportId);
    }

    if (isResult !== undefined && isResult !== null && isResult !== "") {
      query.isResult = String(isResult).toLowerCase() === "true";
    }

    if (matchType !== undefined && matchType !== null && matchType !== "") {
      query.matchType = matchType;
    }

    if (
      search !== undefined &&
      search !== null &&
      String(search).trim() !== ""
    ) {
      const searchText = String(search).trim();

      query.$or = [
        {
          eventName: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          competitionName: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          homeTeam: {
            $regex: searchText,
            $options: "i",
          },
        },
        {
          awayTeam: {
            $regex: searchText,
            $options: "i",
          },
        },
      ];
    }

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);

    const currentLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const skip = (currentPage - 1) * currentLimit;

    const [matches, total] = await Promise.all([
      Match.find(query)
        .sort({
          openDate: -1,
        })
        .skip(skip)
        .limit(currentLimit)
        .lean(),

      Match.countDocuments(query),
    ]);

    return {
      matches,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    };
  } catch (error) {
    console.error("❌ Match service getOldMatches error:", error);

    throw error;
  }
};

const getMatchById = async (eventId) => {
  try {
    if (!eventId) {
      return null;
    }

    return await Match.findOne({
      eventId: String(eventId),
    }).lean();
  } catch (error) {
    console.error("❌ Match service getMatchById error:", error);

    throw error;
  }
};

module.exports = {
  getMatches,
  getOldMatches,
  getMatchById,
};
