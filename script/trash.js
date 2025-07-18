const axios = require("axios");

module.exports.config = {
  name: "trash",
  version: "1.0.3",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis + ChatGPT",
  description: "Generates a trash-style meme image using the given user ID.",
  commandCategory: "fun",
  usages: "trash [userid]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const userId = args.join(" ").trim();

  if (!userId) {
    return api.sendMessage(
      "🗑️ | Please provide a Facebook User ID.\n\nUsage: trash [userid]",
      event.threadID,
      event.messageID
    );
  }

  const apiUrl = `https://api-canvass.vercel.app/trash?userid=${encodeURIComponent(userId)}`;

  try {
    // Fetch raw response as text (probably a direct image URL)
    const response = await axios.get(apiUrl, { responseType: "text" });
    const imageUrl = response.data?.trim();

    console.log("API Response:", imageUrl); // Debug log

    if (!imageUrl || !imageUrl.startsWith("http")) {
      return api.sendMessage(
        "❌ | API returned an invalid or missing image URL.",
        event.threadID,
        event.messageID
      );
    }

    const imgStream = await axios.get(imageUrl, { responseType: "stream" });

    return api.sendMessage(
      {
        body: `🗑️ | Here's the trash meme for user ID: ${userId}`,
        attachment: imgStream.data,
      },
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("Trash command error:", error.message || error);
    return api.sendMessage(
      "⚠️ | Error generating image. The API may be down or the user ID is invalid.",
      event.threadID,
      event.messageID
    );
  }
};
