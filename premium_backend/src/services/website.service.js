const Website = require("../models/website.model");


// ADD WEBSITE
const addWebsite = async (data) => {
  const {
    websiteName,
    domainUrl,
    type,
    premium,
    showResult,
    isAutoResult,
  } = data;

  const existingWebsite = await Website.findOne({
    domainUrl: domainUrl.trim(),
  });

  if (existingWebsite) {
    throw new Error("Website with this domain already exists");
  }

  const website = await Website.create({
    websiteName: websiteName.trim(),

    domainUrl: domainUrl.trim(),

    type: Array.isArray(type) ? type : [],

    premium: {
      enabled: premium?.enabled === true,
      endpoint: premium?.endpoint?.trim() || "",
      rollbackEndpoint:
        premium?.rollbackEndpoint?.trim() || "",
    },

    showResult: {
      enabled: showResult?.enabled === true,
      endpoint: showResult?.endpoint?.trim() || "",
      rollbackEndpoint:
        showResult?.rollbackEndpoint?.trim() || "",
    },

    isAutoResult: isAutoResult === true,

    isRegistered: true,

    isDeleted: false,
  });

  return website;
};


// GET WEBSITES
const getWebsites = async (type = "all") => {
  let filter = {};

  if (type === "all") {
    filter = {
      isDeleted: false,
    };
  }

  else if (type === "premium") {
    filter = {
      type: "premium",
      isDeleted: false,
    };
  }

  else if (type === "showResult") {
    filter = {
      type: "showResult",
      isDeleted: false,
    };
  }

  else if (type === "unregistered") {
    filter = {
      isDeleted: true,
    };
  }

  else {
    throw new Error(
      "Invalid type. Use all, premium, showResult or unregistered"
    );
  }

  const websites = await Website.find(filter).sort({
    createdAt: -1,
  });

  return websites;
};


// GET UNREGISTERED WEBSITES
const getUnregisteredWebsites = async () => {
  const websites = await Website.find({
    isDeleted: true,
    isRegistered: false,
  }).sort({
    createdAt: -1,
  });

  return websites;
};


// GET WEBSITE BY ID
const getWebsiteById = async (id) => {
  const website = await Website.findById(id);

  return website;
};


// UPDATE WEBSITE
const updateWebsite = async (id, data) => {
  const website = await Website.findById(id);

  if (!website) {
    return null;
  }


  // WEBSITE NAME
  if (data.websiteName !== undefined) {

    if (!data.websiteName.trim()) {
      throw new Error("Website name is required");
    }

    website.websiteName =
      data.websiteName.trim();
  }


  // DOMAIN URL
  if (data.domainUrl !== undefined) {

    if (!data.domainUrl.trim()) {
      throw new Error("Domain URL is required");
    }

    const existingWebsite = await Website.findOne({
      domainUrl: data.domainUrl.trim(),
      _id: { $ne: id },
    });

    if (existingWebsite) {
      throw new Error(
        "Website with this domain already exists"
      );
    }

    website.domainUrl =
      data.domainUrl.trim();
  }


  // WEBSITE TYPE
  if (data.type !== undefined) {

    if (!Array.isArray(data.type)) {
      throw new Error("Type must be an array");
    }

    const allowedTypes = [
      "premium",
      "showResult",
    ];

    const isValidType = data.type.every((item) =>
      allowedTypes.includes(item)
    );

    if (!isValidType) {
      throw new Error(
        "Invalid type. Allowed values are premium and showResult"
      );
    }

    website.type = data.type;
  }


  // PREMIUM
  if (data.premium !== undefined) {

    const premiumEnabled =
      data.premium.enabled === true;


    if (premiumEnabled) {

      if (
        !data.premium.endpoint ||
        !data.premium.endpoint.trim()
      ) {
        throw new Error(
          "Premium endpoint is required"
        );
      }

      if (
        !data.premium.rollbackEndpoint ||
        !data.premium.rollbackEndpoint.trim()
      ) {
        throw new Error(
          "Premium rollback endpoint is required"
        );
      }
    }


    website.premium = {
      enabled: premiumEnabled,

      endpoint:
        data.premium.endpoint?.trim() || "",

      rollbackEndpoint:
        data.premium.rollbackEndpoint?.trim() || "",
    };
  }


  // SHOW RESULT
  if (data.showResult !== undefined) {

    const showResultEnabled =
      data.showResult.enabled === true;


    if (showResultEnabled) {

      if (
        !data.showResult.endpoint ||
        !data.showResult.endpoint.trim()
      ) {
        throw new Error(
          "Show Result endpoint is required"
        );
      }

      if (
        !data.showResult.rollbackEndpoint ||
        !data.showResult.rollbackEndpoint.trim()
      ) {
        throw new Error(
          "Show Result rollback endpoint is required"
        );
      }
    }


    website.showResult = {
      enabled: showResultEnabled,

      endpoint:
        data.showResult.endpoint?.trim() || "",

      rollbackEndpoint:
        data.showResult.rollbackEndpoint?.trim() || "",
    };
  }


  // AUTO RESULT
  if (data.isAutoResult !== undefined) {

    website.isAutoResult =
      data.isAutoResult === true;
  }


  await website.save();

  return website;
};


// UNREGISTER WEBSITE
// SOFT DELETE
const unregisterWebsite = async (id) => {
  const website = await Website.findById(id);

  if (!website) {
    return null;
  }

  website.isRegistered = false;

  website.isDeleted = true;

  await website.save();

  return website;
};


// REGISTER WEBSITE AGAIN
const registerWebsite = async (id) => {
  const website = await Website.findById(id);

  if (!website) {
    return null;
  }

  website.isRegistered = true;

  website.isDeleted = false;

  await website.save();

  return website;
};


module.exports = {
  addWebsite,
  getWebsites,
  getUnregisteredWebsites,
  getWebsiteById,
  updateWebsite,
  unregisterWebsite,
  registerWebsite,
};