const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      required: true,
      trim: true,
    },

    domainUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // Website Type
    type: {
      type: [String],
      enum: ["premium", "showResult"],
      default: [],
    },

    premium: {
      enabled: {
        type: Boolean,
        default: false,
      },

      endpoint: {
        type: String,
        default: "",
        trim: true,
      },

      rollbackEndpoint: {
        type: String,
        default: "",
        trim: true,
      },
    },

    showResult: {
      enabled: {
        type: Boolean,
        default: false,
      },

      endpoint: {
        type: String,
        default: "",
        trim: true,
      },

      rollbackEndpoint: {
        type: String,
        default: "",
        trim: true,
      },
    },

    isAutoResult: {
      type: Boolean,
      default: false,
    },

    isRegistered: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Website", websiteSchema);
