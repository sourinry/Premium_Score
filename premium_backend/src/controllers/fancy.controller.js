const Fancy = require("../models/fancyModel");

const fancyList = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "eventId is required",
      });
    }

    const fancyExisting = await Fancy.find({ eventId: eventId }).lean();

    if (!fancyExisting.length) {
      return res.status(404).json({
        success: false,
        message: `Fancy not found this ${eventId}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Fancy fetch successfully!",
      data: fancyExisting,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  fancyList,
};
