const axios = require("axios");

module.exports.config = {
  name: "art",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
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
    const response = await axios.get(`https://api-canvass.vercel.app/art-expert?userid=${encodeURIComponent(userId)}`);

    const { image, caption } = response.data || {};

    if (!image) {
      return api.sendMessage("❌ No art found or invalid response from the API.", event.threadID, event.messageID);
    }

    const imgStream = await axios.get(image, { responseType: "stream" });

    return api.sendMessage(
      {
        body: caption || "🖼️ Here's the AI-generated art:",
        attachment: imgStream.data,
      },
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("[ART ERROR]", error.message);
    return api.sendMessage("⚠️ An error occurred while fetching art. Please try again later.", event.threadID, event.messageID);
  }
};
