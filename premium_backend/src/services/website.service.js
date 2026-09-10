const Website = require("../models/website.model");


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

    // Website Type
    type: Array.isArray(type) ? type : [],

    premium: {
      enabled: premium?.enabled === true,
      endpoint: premium?.endpoint?.trim() || "",
      rollbackEndpoint: premium?.rollbackEndpoint?.trim() || "",
    },

    showResult: {
      enabled: showResult?.enabled === true,
      endpoint: showResult?.endpoint?.trim() || "",
      rollbackEndpoint: showResult?.rollbackEndpoint?.trim() || "",
    },

    isAutoResult: isAutoResult === true,

    isRegistered: true,

    isDeleted: false,
  });

  return website;
};


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



const getWebsiteById = async (id) => {
  const website = await Website.findById(id);

  return website;
};


const updateWebsite = async (id, data) => {
  const website = await Website.findById(id);

  if (!website) {
    return null;
  }

  // Update only the fields we allow
  if (data.websiteName !== undefined) {
    website.websiteName = data.websiteName.trim();
  }

  if (data.domainUrl !== undefined) {
    website.domainUrl = data.domainUrl.trim();
  }

  // Premium update
  if (data.premium !== undefined) {
    website.premium = {
      enabled: data.premium.enabled === true,
      endpoint: data.premium.endpoint?.trim() || "",
      rollbackEndpoint:
        data.premium.rollbackEndpoint?.trim() || "",
    };
  }

  // Show Result update
  if (data.showResult !== undefined) {
    website.showResult = {
      enabled: data.showResult.enabled === true,
      endpoint: data.showResult.endpoint?.trim() || "",
      rollbackEndpoint:
        data.showResult.rollbackEndpoint?.trim() || "",
    };
  }

  // Auto Result update
  if (data.isAutoResult !== undefined) {
    website.isAutoResult = data.isAutoResult === true;
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
  getWebsiteById,
  updateWebsite,
  unregisterWebsite,
  registerWebsite,
};