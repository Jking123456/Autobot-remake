const axios = require("axios");

module.exports.config = {
  name: "fbdp",
  version: "1.2.0",
  hasPrefix: true,
  permission: 0,
  credits: "Vern + ChatGPT",
  description: "Get Facebook profile picture by user ID.",
  commandCategory: "tools",
  usages: "fbdp [facebook_user_id]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // Restrict command to group admin usage only
  const threadInfo = await api.getThreadInfo(threadID);
  if (threadInfo.isGroup) {
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);
    if (!isBotAdmin) {
      return api.sendMessage("🚫 This command can only be used when the bot is an admin in this group.", threadID, messageID);
    }
  }

  const uid = args[0];
  if (!uid || isNaN(uid)) {
    return api.sendMessage("📌 Please provide a valid Facebook user ID.\n\nUsage: fbdp [user_id]", threadID, messageID);
  }

  const imageUrl = `https://urangkapolka.vercel.app/api/fbdp?id=${uid}`;

  try {
    // Fetch the image directly
    const imageData = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    return api.sendMessage({
      body: `📸 Profile picture of UID: ${uid}`,
      attachment: Buffer.from(imageData, "binary")
    }, threadID, messageID);

  } catch (error) {
    console.error("❌ fbdp.js error:", error.message || error);
    return api.sendMessage("⚠️ Failed to fetch profile picture. Please try again later.", threadID, messageID);
  }
};
