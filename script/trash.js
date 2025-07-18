const axios = require("axios");

module.exports.config = {
  name: "trash",
  version: "1.0.1",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebati + ChatGPT",
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
    const response = await axios.get(apiUrl);
    const { image } = response.data;

    if (!image) {
      return api.sendMessage(
        "❌ | API returned an invalid image URL.",
        event.threadID,
        event.messageID
      );
    }

    const imgStream = await axios.get(image, { responseType: "stream" });

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
