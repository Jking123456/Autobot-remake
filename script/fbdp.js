const axios = require("axios");

module.exports.config = {
  name: "fbdp",
  version: "1.0.2",
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

  // Check if command is used in a group
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroup = threadInfo.isGroup;

  if (isGroup) {
    const botID = api.getCurrentUserID();
    const botData = threadInfo.adminIDs.find(item => item.id == botID);
    if (!botData) {
      return api.sendMessage("🚫 This command can only be used when the bot is an admin in this group.", threadID, messageID);
    }
  }

  const uid = args[0];

  if (!uid || isNaN(uid)) {
    return api.sendMessage("📌 Please provide a valid Facebook user ID.\n\nUsage: fbdp [user_id]", threadID, messageID);
  }

  const graphUrl = `https://graph.facebook.com/${uid}/picture?type=large&redirect=false`;

  try {
    // Get image URL via Facebook Graph API with redirect=false
    const { data } = await axios.get(graphUrl);
    const imageUrl = data?.data?.url;

    if (!imageUrl) {
      return api.sendMessage("❌ Failed to get profile picture URL. Try a different UID.", threadID, messageID);
    }

    // Now download the image itself
    const imgBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    return api.sendMessage({
      body: `📸 Profile picture of UID: ${uid}`,
      attachment: Buffer.from(imgBuffer, "binary")
    }, threadID, messageID);

  } catch (err) {
    console.error("fbdp.js error:", err.message || err);
    return api.sendMessage("⚠️ Error fetching profile picture. The UID may be invalid or private.", threadID, messageID);
  }
};
