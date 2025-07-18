const axios = require("axios");

module.exports.config = {
  name: "art",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Fetch AI art related to a specific userid.",
  commandCategory: "art",
  usages: "art [userid]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const userId = args.join(" ").trim();
  if (!userId)
    return api.sendMessage("🎨 Please provide a user ID.\n\nUsage: art [userid]", event.threadID, event.messageID);

  try {
    const res = await axios.get(`https://api-canvass.vercel.app/art-expert?userid=${encodeURIComponent(userId)}`);

    if (!res.data || !res.data.image || res.status !== 200) {
      return api.sendMessage("❌ No art found or invalid response from API.", event.threadID, event.messageID);
    }

    const imageUrl = res.data.image;
    const caption = res.data.caption || "🖼️ Here’s the AI-generated art";

    const imgStream = await axios.get(imageUrl, { responseType: "stream" });

    return api.sendMessage({
      body: caption,
      attachment: imgStream.data
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ Failed to fetch art. Please try again later.", event.threadID, event.messageID);
  }
};
