const mongoose = require("mongoose");

const fancySchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },

    fancyName: {
      type: String,
      default: null,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    id: {
      type: String,
      default: null,
    },

    apiSiteMarketId: {
      type: String,
      default: null,
    },

    sendStatus: {
      type: String,
      default: "1",
    },

    sportId: {
      type: Number,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Fancy ||
  mongoose.model("Fancy", fancySchema);