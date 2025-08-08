const axios = require("axios");

// Cooldown storage to prevent spam
const malupitonCooldowns = new Map();

module.exports.config = {
  name: "malupiton",
  version: "1.0.1",
  permission: 0,
  credits: "pakyubot",
  description: "Auto-reply funny insult from MarkDevs Bossing API",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "Say any of the trigger words and bot will reply",
  cooldowns: 0, // manual cooldown
  dependency: {
    "axios": ""
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;
  if (!body) return;

  const triggers = ["boss", "bossing", "kupal", "ogag", "malupiton", "aray ko"];
  const msg = body.toLowerCase();

  // If message doesn't contain any trigger word, ignore
  if (!triggers.some(word => msg.includes(word))) return;

  // Cooldown check (per user)
  const now = Date.now();
  const cooldownTime = 5 * 1000; // 5 seconds cooldown

  if (malupitonCooldowns.has(senderID) && now - malupitonCooldowns.get(senderID) < cooldownTime) {
    return; // Ignore if still in cooldown
  }

  malupitonCooldowns.set(senderID, now);

  try {
    const prompt = encodeURIComponent(body);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;

    const res = await axios.get(url);
    const replyText = res?.data?.response;

    if (!replyText) return;

    return api.sendMessage(`•| 𝙼𝙰𝙻𝚄𝙿𝙸𝚃𝙾𝙽 |•\n\n${replyText}\n\n•| 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂  |•`, threadID, messageID);

  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error.message || error);
  }
};

module.exports.run = async function () {
  // Not used since this is auto-reply only
};    const prompt = encodeURIComponent(msg);
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
