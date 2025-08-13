const axios = require("axios");

// Cooldown storage per thread
const textCooldowns = new Map();

module.exports.config = {
  name: "fbdownloader",
  version: "1.1.0",
  permission: 0, // Everyone can use
  description: "Automatically download Facebook videos from URL using the new API",
};

module.exports.run = async ({ api, event, utils }) => {
  const { threadID, messageID, body } = event;

  // Regex to detect Facebook video URLs (videos, share, fb.watch)
  const fbRegex = /(https?:\/\/(?:www\.)?facebook\.com\/(?:[^\/\s]+\/videos\/[^\s]+|share\/v\/[^\s]+)|https?:\/\/fb\.watch\/[^\s]+)/i;

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

    // Call new API
    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const response = await axios.get(`https://kaiz-apis.gleeze.com/api/fbdl-v2?url=${encodeURIComponent(fbUrl)}&apikey=${apiKey}`);
    const data = response.data;

    if (!data || !data.download_url) {
      return api.sendMessage("❌ Failed to fetch video.", threadID, messageID);
    }

    const caption = `🎬 Author: ${data.author}`;

    // Send video as attachment
    api.sendMessage(
      {
        body: caption,
        attachment: await utils.getStreamFromURL(data.download_url)
      },
      threadID,
      messageID
    );
  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Error occurred while downloading the video.", threadID, messageID);
  }
};
