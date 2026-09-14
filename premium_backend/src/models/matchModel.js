const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    marketId: {
      type: String,
      default: null,
    },

    eventName: {
      type: String,
      default: null,
    },

    competitionName: {
      type: String,
      default: null,
    },

    competitionId: {
      type: String,
      default: null,
    },

    sportId: {
      type: Number,
      default: null,
    },

    sportName: {
      type: String,
      default: null,
    },

    openDate: {
      type: Date,
      default: null,
    },

    isResult: {
      type: Boolean,
      default: false,
    },

    scoreId: {
      type: String,
      default: null,
    },

    scoreType: {
      type: String,
      default: null,
    },

    matchType: {
      type: String,
      default: "All",
    },


    homeTeam: {
      type: String,
      default: null,
    },

    awayTeam: {
      type: String,
      default: null,
    },

    inning_info: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    matchRuners: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },

    match_ka_type: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Match ||
  mongoose.model("Match", matchSchema);