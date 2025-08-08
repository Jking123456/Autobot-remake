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
  cooldowns: 0,
  dependency: {
    "axios": ""
  }
};

// ✅ Async so await works
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;
  if (!body) return;

  const triggers = ["boss", "bossing", "kupal", "ogag", "malupiton", "aray ko"];
  const msg = body.toLowerCase();

  // Only trigger if message contains one of the trigger words
  if (!triggers.some(word => msg.includes(word))) return;

  // Cooldown check (per user)
  const now = Date.now();
  const cooldownTime = 5 * 1000; // 5 seconds

  if (malupitonCooldowns.has(senderID) && now - malupitonCooldowns.get(senderID) < cooldownTime) {
    return; // Still cooling down
  }

  malupitonCooldowns.set(senderID, now);

  try {
    const prompt = encodeURIComponent(body);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;

    const res = await axios.get(url);
    const replyText = res?.data?.response;

    if (!replyText) return;

    return api.sendMessage(
      `•| 𝙱𝙾𝚂𝚂𝙸𝙽𝙶 𝙱𝙾𝚃 |•\n\n${replyText}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝚙𝚊𝚔𝚢𝚞𝚋𝚘𝚝 |•`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error.message || error);
  }
};

module.exports.run = function () {
  // Not used since this is auto-reply only
};    return; // Still in cooldown
  }

  malupitonCooldowns.set(senderID, now);

  try {
    const prompt = encodeURIComponent(body);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;

    const res = await axios.get(url);
    const replyText = res?.data?.response;

    if (!replyText) return;

    return api.sendMessage(
      `•| 𝙱𝙾𝚂𝚂𝙸𝙽𝙶 𝙱𝙾𝚃 |•\n\n${replyText}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝚙𝚊𝚔𝚢𝚞𝚋𝚘𝚝 |•`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error.message || error);
  }
};

module.exports.run = function () {
  // Not used — this is auto-reply only
};    return; // Still in cooldown
  }

  malupitonCooldowns.set(senderID, now);

  try {
    const prompt = encodeURIComponent(body);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;

    const res = await axios.get(url);
    const replyText = res?.data?.response;

    if (!replyText) return;

    return api.sendMessage(
      `${replyText}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error.message || error);
  }
};

module.exports.run = function () {
  // Not used — this is auto-reply only
};    return; // Ignore if still in cooldown
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
