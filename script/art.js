const axios = require("axios");

module.exports.config = {
  name: "art",
  version: "1.0.2",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis + ChatGPT",
  description: "Fetch AI-generated art based on a user ID.",
  commandCategory: "art",
  usages: "art [userid]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const userId = args.join(" ").trim();

  if (!userId) {
    return api.sendMessage(
      "🎨 Please provide a user ID.\n\n📌 Usage: art [userid]",
      event.threadID,
      event.messageID
    );
  }

  try {
    const res = await axios.get(`https://api-canvass.vercel.app/art-expert?userid=${encodeURIComponent(userId)}`);
    const imageUrl = res.data?.trim();

    // Check if it looks like a valid image URL
    if (!imageUrl || !imageUrl.startsWith("http")) {
      return api.sendMessage(
        "❌ No art found or invalid response from the API.",
        event.threadID,
        event.messageID
      );
    }

    const imgRes = await axios.get(imageUrl, { responseType: "stream" });

    return api.sendMessage(
      {
        body: "🖼️ Here's the AI-generated art:",
        attachment: imgRes.data,
      },
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.error("[ART COMMAND ERROR]", err.message || err);
    return api.sendMessage(
      "⚠️ Failed to fetch art. The API may be offline or the user ID is invalid.",
      event.threadID,
      event.messageID
    );
  }
};
