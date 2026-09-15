const axios = require("axios");

const Fancy = require("../models/fancyModel");

const {
  getMatchesFromRedis,
} = require("./matchRedis.service");


// FANCY API URLs

const FANCY_API = {
  4: "https://cricket2.premiumsoccer.in/api/fancy/getPFancy",
  1: "https://tennis.premiumsoccer.in/api/fancy/getPFancy",
  2: "https://soccer.premiumsoccer.in/api/fancy/getPFancy",
};


// GET FANCY API BY SPORT

const getFancyApi = (sportId) => {
  return FANCY_API[Number(sportId)] || null;
};


// FETCH FANCY FOR ONE MATCH

const fetchFancyForMatch = async (match) => {
  try {
    const eventId =
      String(match.eventId);

    const sportId =
      Number(match.sportId);

    // SPORT CHECK

    if (!FANCY_API[sportId]) {
      console.log(
        `⚠️ Fancy API not configured for sportId=${sportId}`
      );

      return;
    }

    // API URL

    const url =
      `${FANCY_API[sportId]}?eventId=${eventId}`;

    console.log(
      `🎰 Fetching fancy | eventId=${eventId} | sportId=${sportId}`
    );

    // API CALL

    const response =
      await axios.get(url, {
        headers: {
          "Content-Type":
            "application/json",
        },

        timeout: 30000,
      });

    // SPORTS BOOK MARKET CHECK

    const sportsBookMarket =
      response?.data?.data?.sportsBookMarket;

    if (
      sportsBookMarket === undefined
    ) {
      console.log(
        `⚠️ sportsBookMarket not found | eventId=${eventId} | sportId=${sportId}`
      );

      return;
    }

  // GET FANCY ARRAY

    let fancyData = [];

    if (
      Array.isArray(
        sportsBookMarket
      )
    ) {
      fancyData =
        sportsBookMarket;
    } else if (
      Array.isArray(
        sportsBookMarket?.data
      )
    ) {
      fancyData =
        sportsBookMarket.data;
    } else if (
      Array.isArray(
        response?.data?.data?.sportsBookMarket
      )
    ) {
      fancyData =
        response.data.data
          .sportsBookMarket;
    }

    // IF DIRECT OBJECT

    if (
      !Array.isArray(fancyData) &&
      sportsBookMarket &&
      typeof sportsBookMarket === "object"
    ) {
      fancyData = Object.values(
        sportsBookMarket
      );
    }

    console.log(
      `📦 Fancy records received | eventId=${eventId} | sportId=${sportId}: ${fancyData.length}`
    );

    if (!fancyData.length) {
      return;
    }

    // ONLY sportsBookSelection != null

    const validFancy =
      fancyData.filter(
        (dt) =>
          dt &&
          dt.sportsBookSelection != null
      );

    console.log(
      `✅ Valid fancy records | eventId=${eventId}: ${validFancy.length}`
    );

    if (!validFancy.length) {
      return;
    }

    // EXISTING FANCY IDS

    const ids =
      validFancy
        .map(
          (dt) =>
            dt.id !== undefined &&
            dt.id !== null
              ? String(dt.id)
              : null
        )
        .filter(Boolean);

    const existingFancy =
      await Fancy.find(
        {
          eventId,
          sportId,

          id: {
            $in: ids,
          },
        },
        {
          id: 1,
        }
      ).lean();

    const existingIds =
      new Set(
        existingFancy.map(
          (dt) =>
            String(dt.id)
        )
      );

    // NEW FANCY

    const notExists =
      validFancy.filter(
        (dt) =>
          !existingIds.has(
            String(dt.id)
          )
      );

    console.log(
      `🆕 New fancy records | eventId=${eventId}: ${notExists.length}`
    );

    // INSERT

    const addNewFancy =
      notExists.map((dt) => ({
        eventId:

          eventId,

        fancyName:
          dt.marketName || null,

        data:
          dt,

        id:
          dt.id !== undefined &&
          dt.id !== null
            ? String(dt.id)
            : null,

        apiSiteMarketId:
          dt.apiSiteMarketId !== undefined &&
          dt.apiSiteMarketId !== null
            ? String(
                dt.apiSiteMarketId
              )
            : null,

        sendStatus:
          "1",

        sportId:
          sportId,
      }));

    if (
      addNewFancy.length > 0
    ) {
      try {
        const inserted =
          await Fancy.insertMany(
            addNewFancy,
            {
              ordered: false,
            }
          );

        console.log(
          `✅ ${inserted.length} fancy inserted | eventId=${eventId} | sportId=${sportId}`
        );
      } catch (error) {
        console.error(
          `❌ Fancy insert error | eventId=${eventId}:`,
          error.message
        );
      }
    } else {
      console.log(
        `ℹ️ No new fancy | eventId=${eventId}`
      );
    }

  } catch (error) {
    console.error(
      `❌ Fancy failed | eventId=${match.eventId} | sportId=${match.sportId}:`,
      error.message
    );
  }
};


// PROCESS FANCY FROM REDIS

const processFancyFromRedis = async () => {
  try {
    console.log(
      "\n=========================================="
    );

    console.log(
      "🎰 FANCY SERVICE STARTED"
    );

    console.log(
      "=========================================="
    );

    // GET MATCHES FROM REDIS

    const matches =
      await getMatchesFromRedis();

    if (!matches.length) {
      console.log(
        "⚠️ No matches available in Redis"
      );

      return;
    }

    // -------------------------------------------------
    // PROCESS ALL MATCHES
    // -------------------------------------------------

    for (const match of matches) {
      await fetchFancyForMatch(
        match
      );
    }

    console.log(
      "✅ FANCY SERVICE COMPLETED"
    );

  } catch (error) {
    console.error(
      "❌ processFancyFromRedis error:",
      error.message
    );
  }
};


module.exports = {
  getFancyApi,
  fetchFancyForMatch,
  processFancyFromRedis,
};