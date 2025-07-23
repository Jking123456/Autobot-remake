const axios = require("axios");

module.exports.config = {
  name: "zipcode",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Lookup Philippine location info from a ZIP code.",
  commandCategory: "tools",
  usages: "zipcode [zipcode]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const zip = args.join(" ").trim();

  // ✅ Check if bot is admin in group chat
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command can only be used in groups where the bot is an admin.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check error:", err);
    return api.sendMessage("⚠️ Failed to check admin permissions. Try again later.", threadID, messageID);
  }

  if (!zip) {
    return api.sendMessage("📮 Please provide a ZIP code.\n\nUsage: zipcode [zipcode]", threadID, messageID);
  }

  const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
  const url = `https://kaiz-apis.gleeze.com/api/zipcodeinfo?country=ph&zipcode=${encodeURIComponent(zip)}&apikey=${apiKey}`;

  try {
    const res = await axios.get(url);
    const data = res.data;

    if (!data["post code"] || !data.places || data.places.length === 0) {
      return api.sendMessage("❌ ZIP code not found or invalid.", threadID, messageID);
    }

    const place = data.places[0];

    const message =
`📍 ZIP Code Info (PH)

📬 ZIP Code: ${data["post code"]}
📦 Location: ${place["place name"]}
🌍 Country: ${data.country} (${data["country abbreviation"]})
📌 Coordinates: ${place.latitude}, ${place.longitude}`;

    return api.sendMessage(message, threadID, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Error retrieving ZIP code info. Please try again later.", threadID, messageID);
  }
};
