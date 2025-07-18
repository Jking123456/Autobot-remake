const axios = require("axios");

module.exports.config = {
  name: "art",
  version: "1.0.1",
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
    const data = res.data;

    // ✅ Check if API returned error or invalid structure
    if (!data || !data.image || typeof data.image !== "string") {
      return api.sendMessage(
        "❌ No art found or invalid response from the API.",
        event.threadID,
        event.messageID
      );
    }

    // 🖼 Fetch the image stream
    const imgRes = await axios.get(data.image, { responseType: "stream" });

    return api.sendMessage(
      {
        body: data.caption || "🖼️ Here's the AI-generated art:",
        attachment: imgRes.data,
      },
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.error("[ART COMMAND ERROR]", err);
    return api.sendMessage(
      "⚠️ Failed to fetch art. The API may be offline or the user ID is invalid.",
      event.threadID,
      event.messageID
    );
  }
};
