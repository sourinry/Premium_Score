const matchService = require("../services/match.service");

// =====================================================
// GET CURRENT MATCHES
// =====================================================

const getMatches = async (
  req,
  res
) => {
  try {
    const result =
      await matchService.getMatches(
        req.query
      );

    return res.status(200).json({
      success: true,

      message:
        "Matches fetched successfully",

      count:
        result.matches.length,

      total:
        result.total,

      page:
        result.page,

      limit:
        result.limit,

      totalPages:
        result.totalPages,

      data:
        result.matches,
    });
  } catch (error) {
    console.error(
      "❌ Get matches error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to fetch matches",
    });
  }
};

// =====================================================
// GET OLD MATCHES
// =====================================================

const getOldMatches = async (
  req,
  res
) => {
  try {
    const result =
      await matchService.getOldMatches(
        req.query
      );

    return res.status(200).json({
      success: true,

      message:
        "Old matches fetched successfully",

      count:
        result.matches.length,

      total:
        result.total,

      page:
        result.page,

      limit:
        result.limit,

      totalPages:
        result.totalPages,

      data:
        result.matches,
    });
  } catch (error) {
    console.error(
      "❌ Get old matches error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to fetch old matches",
    });
  }
};

// =====================================================
// GET MATCH BY EVENT ID
// =====================================================

const getMatchById = async (
  req,
  res
) => {
  try {
    const { eventId } =
      req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message:
          "Event ID is required",
      });
    }

    const match =
      await matchService.getMatchById(
        eventId
      );

    if (!match) {
      return res.status(404).json({
        success: false,
        message:
          "Match not found",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        "Match fetched successfully",

      data: match,
    });
  } catch (error) {
    console.error(
      "❌ Get match by ID error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to fetch match",
    });
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