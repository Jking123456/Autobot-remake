const axios = require("axios");

module.exports.config = {
  name: "fbdp",
  version: "1.0.1",
  hasPrefix: true,
  permission: 0,
  credits: "Vern + ChatGPT",
  description: "Get Facebook profile picture by user ID.",
  commandCategory: "tools",
  usages: "fbdp [facebook_user_id]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Check if command is used in a group
  const threadInfo = await api.getThreadInfo(threadID);
  const isGroup = threadInfo.isGroup;

  // If in group, check if bot is admin
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

  const apiUrl = `https://urangkapolka.vercel.app/api/fbdp?id=${uid}`;

  try {
    const response = await axios.get(apiUrl);
    const imageUrl = response?.data?.data;

    if (!imageUrl) {
      return api.sendMessage("❌ Couldn't fetch profile picture. Try again later.", threadID, messageID);
    }

    const imgData = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    return api.sendMessage(
      {
        body: `📸 Profile picture of UID: ${uid}`,
        attachment: Buffer.from(imgData, "binary")
      },
      threadID,
      messageID
    );

  } catch (error) {
    console.error(error);
    return api.sendMessage("⚠️ Error fetching profile picture. Please check the UID and try again.", threadID, messageID);
  }
};
