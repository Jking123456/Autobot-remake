const axios = require("axios");

const malupitonCooldowns = new Map();
const BOT_ID = "61577980796119"; // Your bot's FB ID to avoid self-reply

module.exports.config = {
  name: "malupiton",
  version: "1.0.0",
  permission: 0,
  credits: "pakyubot",
  description: "Auto reply using Bossing API when trigger words are detected",
  prefix: false,
  category: "without prefix",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body, senderID } = event;
  if (!body) return;

  // Ignore messages from the bot itself
  if (String(senderID) === BOT_ID) return;

  const triggers = ["boss", "bossing", "kupal", "ogag", "malupiton", "aray ko"];
  const msgLower = body.toLowerCase();

  // Check if any trigger word is in the message
  let triggered = false;
  for (let word of triggers) {
    if (msgLower.includes(word)) {
      triggered = true;
      break;
    }
  }
  if (!triggered) return;

  // Cooldown to prevent spam
  const now = Date.now();
  const cooldownTime = 5000; // 5 seconds
  if (malupitonCooldowns.has(senderID) && now - malupitonCooldowns.get(senderID) < cooldownTime) {
    return;
  }
  malupitonCooldowns.set(senderID, now);

  try {
    const prompt = encodeURIComponent(body);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;
    const res = await axios.get(url);

    if (res.data && res.data.response) {
      api.sendMessage(
        `•| 𝙱𝙾𝚂𝚂𝙸𝙽𝙶 𝙱𝙾𝚃 |•\n\n${res.data.response}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝚙𝚊𝚔𝚢𝚞𝚋𝚘𝚝 |•`,
        threadID,
        messageID
      );
    }
  } catch (err) {
    console.error("Malupiton API Error:", err.message || err);
  }
};

module.exports.run = function () {};  ) {
    return;
  }

  malupitonCooldowns.set(senderID, now);

  try {
    const prompt = encodeURIComponent(body);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;
    const res = await axios.get(url);

    if (res.data && res.data.response) {
      api.sendMessage(
        `•| 𝙱𝙾𝚂𝚂𝙸𝙽𝙶 𝙱𝙾𝚃 |•\n\n${res.data.response}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝚙𝚊𝚔𝚢𝚞𝚋𝚘𝚝 |•`,
        threadID,
        messageID
      );
    }
  } catch (error) {
    console.error("Malupiton API Error:", error.message || error);
  }
};

module.exports.run = function () {};      now - malupitonCooldowns.get(senderID) < cooldownTime
    ) {
      return;
    }

    malupitonCooldowns.set(senderID, now);

    try {
      const prompt = encodeURIComponent(body);
      const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;
      const res = await axios.get(url);

      if (res.data && res.data.response) {
        api.sendMessage(
          `•| 𝙱𝙾𝚂𝚂𝙸𝙽𝙶 𝙱𝙾𝚃 |•\n\n${res.data.response}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝚙𝚊𝚔𝚢𝚞𝚋𝚘𝚝 |•`,
          threadID,
          messageID
        );
      }
    } catch (error) {
      console.error("Malupiton API Error:", error.message || error);
    }
  })();
};

module.exports.run = function () {};  ) {
    return;
  }

  malupitonCooldowns.set(senderID, now);

  try {
    const prompt = encodeURIComponent(body);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;
    const res = await axios.get(url);

    if (res.data && res.data.response) {
      api.sendMessage(
        `•| 𝙱𝙾𝚂𝚂𝙸𝙽𝙶 𝙱𝙾𝚃 |•\n\n${res.data.response}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝚙𝚊𝚔𝚢𝚞𝚋𝚘𝚝 |•`,
        threadID,
        messageID
      );
    }
  } catch (error) {
    console.error("Malupiton API Error:", error.message || error);
  }
};

module.exports.run = function () {};
  try {
    const prompt = encodeURIComponent(body);
    const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;
    const res = await axios.get(url);

    if (res.data && res.data.response) {
      api.sendMessage(
        `•| 𝙼𝙰𝙻𝚄𝙿𝙸𝚃𝙾𝙽 |•\n\n${res.data.response}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`,
        threadID,
        messageID
      );
    }
  } catch (error) {
    console.error("Malupiton API Error:", error.message || error);
  }
};

module.exports.run = function () {};    if (res.data && res.data.response) {
      api.sendMessage(
        `•| 𝙱𝙾𝚂𝚂𝙸𝙽𝙶 𝙱𝙾𝚃 |•\n\n${res.data.response}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝚙𝚊𝚔𝚢𝚞𝚋𝚘𝚝 |•`,
        threadID,
        messageID
      );
    }
  } catch (error) {
    console.error("Malupiton API Error:", error.message || error);
  }
};

module.exports.run = function () {};
