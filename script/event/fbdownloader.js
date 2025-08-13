const axios = require("axios");

// Cooldown storage per thread
const textCooldowns = new Map();

module.exports.config = {
  name: "fbdownloader",
  version: "1.0.0",
  permission: 0, // Everyone can use
  description: "Automatically download Facebook videos from URL",
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, body } = event;

  // Regex to detect Facebook video URLs
  const fbRegex = /(https?:\/\/(www\.)?facebook\.com\/[^\s]+)/i;

  if (!fbRegex.test(body)) return;

  // Cooldown check (5 seconds per thread)
  if (textCooldowns.has(threadID)) {
    const last = textCooldowns.get(threadID);
    if (Date.now() - last < 5000) return;
  }
  textCooldowns.set(threadID, Date.now());

  try {
    // Send "Downloading..." message
    api.sendMessage("⏳ Downloading your Facebook video...", threadID, messageID);

    // Get FB URL from message
    const fbUrl = body.match(fbRegex)[0];

    // Call API
    const response = await axios.get(`https://kaiz-apis.gleeze.com/api/fbdl?url=${encodeURIComponent(fbUrl)}`);
    const data = response.data;

    if (!data || !data.videoUrl) {
      return api.sendMessage("❌ Failed to fetch video.", threadID, messageID);
    }

    const caption = `🎬 Title: ${data.title}\n👤 Author: ${data.author}\n📹 Quality: ${data.quality}`;

    // Send video as attachment
    api.sendMessage(
      {
        body: caption,
        attachment: await global.utils.getStreamFromURL(data.videoUrl) // If your bot framework supports streaming URLs
      },
      threadID,
      messageID
    );
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Error occurred while downloading the video.", threadID, messageID);
  }
};
