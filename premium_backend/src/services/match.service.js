const Match = require("../models/matchModel");

// =====================================================
// GET CURRENT MATCHES
// =====================================================

const getMatches = async (
  filters = {}
) => {
  try {
    const {
      sportId,
      isResult,
      matchType,
      search,
      page = 1,
      limit = 20,
    } = filters;

    // =============================================
    // CURRENT MATCHES ONLY
    // =============================================

    const query = {
      isOld: false,
    };

    // =============================================
    // SPORT
    // =============================================

    if (
      sportId !== undefined &&
      sportId !== null &&
      sportId !== ""
    ) {
      query.sportId = Number(
        sportId
      );
    }

    // =============================================
    // RESULT
    // =============================================

    if (
      isResult !== undefined &&
      isResult !== null &&
      isResult !== ""
    ) {
      query.isResult =
        String(isResult).toLowerCase() ===
        "true";
    }

    // =============================================
    // MATCH TYPE
    // =============================================

    if (
      matchType !== undefined &&
      matchType !== null &&
      matchType !== ""
    ) {
      query.matchType = matchType;
    }

    // =============================================
    // SEARCH
    // =============================================

    if (
      search !== undefined &&
      search !== null &&
      String(search).trim() !== ""
    ) {
      const searchText =
        String(search).trim();

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

    // =============================================
    // PAGINATION
    // =============================================

    const currentPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const currentLimit = Math.min(
      Math.max(
        parseInt(limit, 10) || 20,
        1
      ),
      100
    );

    const skip =
      (currentPage - 1) *
      currentLimit;

    // =============================================
    // FETCH
    // =============================================

    const [
      matches,
      total,
    ] = await Promise.all([
      Match.find(query)
        .sort({
          openDate: 1,
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
      totalPages: Math.ceil(
        total / currentLimit
      ),
    };
  } catch (error) {
    console.error(
      "❌ Match service getMatches error:",
      error
    );

    throw error;
  }
};

// =====================================================
// GET OLD MATCHES
// =====================================================

const getOldMatches = async (
  filters = {}
) => {
  try {
    const {
      sportId,
      isResult,
      matchType,
      search,
      page = 1,
      limit = 20,
    } = filters;

    // =============================================
    // OLD MATCHES ONLY
    // =============================================

    const query = {
      isOld: true,
    };

    // =============================================
    // SPORT
    // =============================================

    if (
      sportId !== undefined &&
      sportId !== null &&
      sportId !== ""
    ) {
      query.sportId = Number(
        sportId
      );
    }

    // =============================================
    // RESULT
    // =============================================

    if (
      isResult !== undefined &&
      isResult !== null &&
      isResult !== ""
    ) {
      query.isResult =
        String(isResult).toLowerCase() ===
        "true";
    }

    // =============================================
    // MATCH TYPE
    // =============================================

    if (
      matchType !== undefined &&
      matchType !== null &&
      matchType !== ""
    ) {
      query.matchType = matchType;
    }

    // =============================================
    // SEARCH
    // =============================================

    if (
      search !== undefined &&
      search !== null &&
      String(search).trim() !== ""
    ) {
      const searchText =
        String(search).trim();

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

    // =============================================
    // PAGINATION
    // =============================================

    const currentPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const currentLimit = Math.min(
      Math.max(
        parseInt(limit, 10) || 20,
        1
      ),
      100
    );

    const skip =
      (currentPage - 1) *
      currentLimit;

    // =============================================
    // FETCH OLD MATCHES
    // =============================================

    const [
      matches,
      total,
    ] = await Promise.all([
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
      totalPages: Math.ceil(
        total / currentLimit
      ),
    };
  } catch (error) {
    console.error(
      "❌ Match service getOldMatches error:",
      error
    );

    throw error;
  }
};

// =====================================================
// GET MATCH BY EVENT ID
// =====================================================

const getMatchById = async (
  eventId
) => {
  try {
    if (!eventId) {
      return null;
    }

    return await Match.findOne({
      eventId: String(eventId),
    }).lean();
  } catch (error) {
    console.error(
      "❌ Match service getMatchById error:",
      error
    );

    throw error;
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getMatches,
  getOldMatches,
  getMatchById,
};