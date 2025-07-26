const axios = require("axios");

module.exports.config = {
  name: "fbdp",
  version: "1.1.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Get Facebook profile picture by user ID.",
  commandCategory: "tools",
  usages: "fbdp [facebook_user_id]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // Admin restriction for group
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

  const apiUrl = `https://urangkapolka.vercel.app/api/fbdp?id=${uid}`;

  try {
    // Get the HTML response
    const htmlRes = await axios.get(apiUrl, { responseType: "text" });
    const html = htmlRes.data;

    // Extract image URL from <img src="...">
    const match = html.match(/<img[^>]+src="([^"]+)"/i);
    const imageUrl = match ? match[1] : null;

    if (!imageUrl) {
      return api.sendMessage("❌ Couldn't extract image from API page.", threadID, messageID);
    }

    // Download the image
    const imageData = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    return api.sendMessage({
      body: `📸 Profile picture of UID: ${uid}`,
      attachment: Buffer.from(imageData, "binary")
    }, threadID, messageID);

  } catch (err) {
    console.error("❌ fbdp.js error:", err.message || err);
    return api.sendMessage("⚠️ Failed to fetch profile picture. Please try again later.", threadID, messageID);
  }
};
