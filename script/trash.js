const axios = require("axios");

module.exports.config = {
  name: "trash",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebati",
  description: "Get a fun trash-style image using a userid.",
  commandCategory: "fun",
  usages: "trash [userid]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const userId = args.join(" ").trim();
  if (!userId)
    return api.sendMessage("🗑️ Please provide a user ID.\n\nUsage: trash [userid]", event.threadID, event.messageID);

  try {
    const res = await axios.get(`https://api-canvass.vercel.app/trash?userid=${encodeURIComponent(userId)}`);
    const data = res.data;

    if (!data || !data.image || res.status !== 200) {
      return api.sendMessage("❌ Failed to generate trash image or invalid response.", event.threadID, event.messageID);
    }

    const img = await axios.get(data.image, { responseType: "stream" });

    return api.sendMessage({
      body: `🗑️ Trash Rendered for: ${userId}`,
      attachment: img.data
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Error generating trash image. Try again later.", event.threadID, event.messageID);
  }
};
