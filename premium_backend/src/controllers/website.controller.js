const websiteService = require("../services/website.service");

const addWebsite = async (req, res) => {
  try {
    const {
      websiteName,
      domainUrl,
      premium,
      showResult,
      isAutoResult,
    } = req.body;

    if (!websiteName || !websiteName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Website name is required",
      });
    }

    if (!domainUrl || !domainUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Domain URL is required",
      });
    }

    // PREMIUM VALIDATION

    if (premium?.enabled === true) {

      if (!premium.endpoint || !premium.endpoint.trim()) {
        return res.status(400).json({
          success: false,
          message: "Premium endpoint is required",
        });
      }

      if (
        !premium.rollbackEndpoint ||
        !premium.rollbackEndpoint.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Premium rollback endpoint is required",
        });
      }
    }


    // SHOW RESULT VALIDATION

    if (showResult?.enabled === true) {

      if (!showResult.endpoint || !showResult.endpoint.trim()) {
        return res.status(400).json({
          success: false,
          message: "Show Result endpoint is required",
        });
      }

      if (
        !showResult.rollbackEndpoint ||
        !showResult.rollbackEndpoint.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Show Result rollback endpoint is required",
        });
      }
    }


    // SERVICE

    const website = await websiteService.addWebsite(req.body);

    return res.status(201).json({
      success: true,
      message: "Website added successfully",
      data: website,
    });

  } catch (error) {

    console.error("Add website error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
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


const getWebsiteById = async (req, res) => {
  try {

    const website = await websiteService.getWebsiteById(
      req.params.id
    );


    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }


    return res.status(200).json({
      success: true,
      data: website,
    });

  } catch (error) {

    console.error("Get website by id error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// UPDATE WEBSITE

const updateWebsite = async (req, res) => {
  try {

    const website = await websiteService.updateWebsite(
      req.params.id,
      req.body
    );


    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }


    return res.status(200).json({
      success: true,
      message: "Website updated successfully",
      data: website,
    });

  } catch (error) {

    console.error("Update website error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// UNREGISTER WEBSITE
// SOFT DELETE

const unregisterWebsite = async (req, res) => {
  try {

    const website = await websiteService.unregisterWebsite(
      req.params.id
    );


    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }


    return res.status(200).json({
      success: true,
      message: "Website unregistered successfully",
      data: website,
    });

  } catch (error) {

    console.error("Unregister website error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// REGISTER WEBSITE AGAIN

const registerWebsite = async (req, res) => {
  try {

    const website = await websiteService.registerWebsite(
      req.params.id
    );


    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }


    return res.status(200).json({
      success: true,
      message: "Website registered successfully",
      data: website,
    });

  } catch (error) {

    console.error("Register website error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  addWebsite,
  getWebsites,
  getWebsiteById,
  updateWebsite,
  unregisterWebsite,
  registerWebsite,
};