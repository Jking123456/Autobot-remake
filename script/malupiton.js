const axios = require("axios");

// Cooldown storage
const malupitonCooldowns = new Map();

module.exports.config = {
  name: "malupiton",
  version: "1.0.0",
  permission: 0,
  credits: "pakyubot",
  description: "Funny insult from MarkDevs Bossing API",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "Just say boss, bossing, kupal, ogag, malupiton, or aray ko",
  cooldowns: 0, // We'll handle cooldown manually
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;
  const triggers = ["boss", "bossing", "kupal", "ogag", "malupiton", "aray ko"];
  const msg = body?.toLowerCase() || "";

  // Check trigger
  if (!triggers.some(word => msg.includes(word))) return;

  const now = Date.now();
  const cooldownTime = 5 * 1000; // 5 seconds cooldown

  if (malupitonCooldowns.has(senderID) && now - malupitonCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - malupitonCooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before talking to Bossing again.`, threadID, messageID);
  }

  malupitonCooldowns.set(senderID, now);

  try {
    const prompt = encodeURIComponent(msg);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;

    const res = await axios.get(url);
    const replyText = res?.data?.response;

    if (!replyText) {
      return api.sendMessage("⚠️ Wala akong nakuha kay Bossing.", threadID, messageID);
    }

    return api.sendMessage(`•| 𝙼𝙰𝙻𝚄𝙿𝙸𝚃𝙾𝙽 |•\n\n${replyText}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`, threadID, messageID);

  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error.message || error);
    return api.sendMessage("❌ An error occurred while talking to Bossing. Please try again later.", threadID, messageID);
  }
};
