const axios = require("axios");

module.exports.config = {
  name: "fbdp",
  version: "1.0.8",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Get a fixed Facebook profile picture from API.",
  commandCategory: "tools",
  usages: "fbdp",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  // Require bot to be admin in group
  const threadInfo = await api.getThreadInfo(threadID);
  if (threadInfo.isGroup) {
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);
    if (!isBotAdmin) {
      return api.sendMessage("🚫 This command can only be used when the bot is an admin in this group.", threadID, messageID);
    }
  }

  // Use the static API link (no UID in query)
  const apiUrl = `https://urangkapolka.vercel.app/api/fbdp?id=`;

  try {
    const response = await axios.get(apiUrl, {
      responseType: "arraybuffer",
      maxRedirects: 5
    });

    return api.sendMessage({
      body: `📸 Facebook profile picture`,
      attachment: Buffer.from(response.data, "binary")
    }, threadID, messageID);

  } catch (err) {
    console.error("fbdp.js error:", err.message || err);
    return api.sendMessage("⚠️ Failed to fetch profile picture. Please try again later.", threadID, messageID);
  }
};
