const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map(); // per-user
const threadCooldowns = new Map(); // per-thread

// Trigger words (lowercase)
const triggerWords = [
  "malupiton",
  "kupal",
  "ogag",
  "boss",
  "bossing",
  "tagumpay",
  "tarantado",
  "tarub",
  "aray"
];

module.exports.config = {
  name: "malupiton",
  version: "1.0.5",
  permission: 0,
  credits: "You + ChatGPT Fix",
  description: "Auto-replies when trigger words are detected using Bossing API.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "Just type any trigger word",
  cooldowns: 0 // custom cooldown used instead
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply, isGroup } = event;

  if (!body || typeof body !== "string") return;

  // Bot ID check
  let botID;
  try {
    botID = api.getCurrentUserID();
  } catch (err) {
    console.warn("⚠️ Couldn't fetch bot ID:", err);
    return;
  }

  // 🚫 Ignore all bot's own messages
  if (senderID === botID) return;

  // 🚫 Ignore messages that are replies to the bot
  if (messageReply && messageReply.senderID === botID) return;

  // 🚫 Ignore the locked admin restriction message
  const lockedText = "🚫 Locked ! to use this, make the bot admin in this group.";
  if (body.includes(lockedText)) return;

  // 📌 Thread-level cooldown to stop spam & bot ping-pong
  const threadCooldownTime = 5000; // 5 seconds
  if (threadCooldowns.has(threadID) && Date.now() - threadCooldowns.get(threadID) < threadCooldownTime) {
    return;
  }
  threadCooldowns.set(threadID, Date.now());

  const lowerBody = body.toLowerCase();
  if (!triggerWords.some(word => lowerBody.includes(word))) return;

  // Restriction: check if bot is admin in group
  if (isGroup) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const isAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);
      if (!isAdmin) {
        return api.sendMessage(lockedText, threadID, messageID);
      }
    } catch (err) {
      console.error("❌ Error checking admin status:", err);
      return;
    }
  }

  // Per-user cooldown
  const now = Date.now();
  const cooldownTime = 6000;
  if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Hoy, maghintay ka ng ${timeLeft} segundo muna bago magpadala ulit, Bossing.`, threadID, messageID);
  }
  textCooldowns.set(senderID, now);

  // Show usage guide if exactly "malupiton"
  if (lowerBody.trim() === "malupiton") {
    const guideMessage = 
`📜 𝗠𝗔𝗟𝗨𝗣𝗜𝗧𝗢𝗡 𝗕𝗢𝗧 - 𝗚𝗨𝗜𝗗𝗘 📜

💬 𝗧𝗿𝗶𝗴𝗴𝗲𝗿 𝗪𝗼𝗿𝗱𝘀:
${triggerWords.map(w => `• ${w}`).join("\n")}

🛠 𝗛𝗼𝘄 𝘁𝗼 𝗨𝘀𝗲:
1. Just type any trigger word in the chat (no prefix needed).
2. The bot will automatically reply with a Bossing-style message.
3. Example: type "boss" or "ogag".

ℹ Some commands might be locked.  
   To unlock them, make the bot an admin in the group.

⚡ 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: 6 seconds per user.`;
    return api.sendMessage(guideMessage, threadID, messageID);
  }

  // Normal Bossing API flow
  const API_BASE = "https://markdevs-last-api-p2y6.onrender.com/bossing";
  const UID = Math.floor(Math.random() * 1000000).toString();
  const question = body.trim();

  try {
    const url = `${API_BASE}?prompt=${encodeURIComponent(question)}&uid=${encodeURIComponent(UID)}`;
    const res = await axios.get(url, { timeout: 20000 });
    const data = res?.data;

    let replyText = "";
    if (typeof data === "string") {
      replyText = data;
    } else if (data.response) {
      replyText = data.response;
    } else if (data.data && data.data.response) {
      replyText = data.data.response;
    } else {
      replyText = JSON.stringify(data);
    }

    if (replyText.length > 1900) replyText = replyText.slice(0, 1900) + "\n\n... (trimmed)";

    const final = ` •| 𝙼𝙰𝙻𝚄𝙿𝙸𝚃𝙾𝙽  |•\n\n${replyText}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙰𝙽𝙾𝙽𝚈𝙼𝙾𝚄𝚂 𝙶𝚄𝚈 |•`;
    return api.sendMessage(final, threadID, messageID);
  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error?.message || error);
    return api.sendMessage("❌ May problema sa Bossing API. Subukan ulit mamaya, Bossing.", threadID, messageID);
  }
};

module.exports.run = () => {};
