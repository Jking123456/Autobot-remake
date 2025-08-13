const axios = require("axios");

// Cooldown storage (per user)
const textCooldowns = new Map();

module.exports.config = {
  name: "ashley",
  version: "1.0.4",
  permission: 0,
  credits: "Bogart Magalapok + ChatGPT",
  description: "AI girlfriend auto-replies when message starts with 'ashley <question>'.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "ashley <question>",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, isGroup } = event;
  if (!body || typeof body !== "string") return;

  // Fetch bot's own ID
  let botID;
  try {
    botID = api.getCurrentUserID();
  } catch (err) {
    console.warn("⚠️ Couldn't fetch bot ID:", err);
    return;
  }

  if (senderID === botID) return;

  const trimmed = body.trim();
  const lowerTrimmed = trimmed.toLowerCase();

  // Show usage when only "ashley" is typed
  if (lowerTrimmed === "ashley") {
    return api.sendMessage(
      "💡 Usage: `ashley <question>`\nExample: `ashley kumusta ka?`",
      threadID,
      messageID
    );
  }

  // Trigger only if message starts with "ashley "
  if (!lowerTrimmed.startsWith("ashley ")) return;

  // 🔒 Restriction: Only run if bot is admin in group chats
  if (isGroup) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.",
          threadID,
          messageID
        );
      }
    } catch (err) {
      console.error("❌ Error fetching thread info:", err);
    }
  }

  // Per-user cooldown
  const now = Date.now();
  const cooldownTime = 6000;
  if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Hoy, maghintay ka ng ${timeLeft} segundo muna bago magpadala ulit, babe.`, threadID, messageID);
  }
  textCooldowns.set(senderID, now);

  // Prepare API request
  const API_BASE = "https://markdevs-last-api-p2y6.onrender.com/ashley";
  const UID = Math.floor(Math.random() * 1000000).toString();
  const question = trimmed.substring(7).trim(); // remove "ashley "

  try {
    const url = `${API_BASE}?prompt=${encodeURIComponent(question)}&uid=${encodeURIComponent(UID)}`;
    const res = await axios.get(url, { timeout: 20000 });
    const data = res?.data;

    let replyText = "";
    if (typeof data === "string") {
      replyText = data;
    } else if (data && data.response) {
      replyText = data.response;
    } else if (data && data.data && data.data.response) {
      replyText = data.data.response;
    } else {
      replyText = JSON.stringify(data);
    }

    // Block unsafe replies
    const blockedPatterns = /(bata|child|minor|underage|under-age|kinder|anak)/i;
    if (blockedPatterns.test(replyText.toLowerCase())) {
      console.warn("⚠️ Blocked potential minor-related response from Ashley API.");
      return api.sendMessage(
        "⚠️ Hindi ako pwedeng magbigay ng ganoong klaseng sagot. Pakitanong ang iba o subukan ang ibang usapan, mahal.",
        threadID,
        messageID
      );
    }

    if (replyText.length > 1900) replyText = replyText.slice(0, 1900) + "\n\n... (trimmed)";

    const final = ` •| 𝙰𝚂𝙷𝙻𝙴𝚈 |•\n\n${replyText}\n\n•| 𝙰𝙸 - 𝙶𝙸𝚁𝙻𝙵𝚁𝙸𝙴𝙽𝙳  |•`;
    return api.sendMessage(final, threadID, messageID);

  } catch (error) {
    console.error("❌ Ashley API Error:", error?.response?.data || error?.message || error);
    return api.sendMessage("❌ May problema sa Ashley API. Subukan ulit mamaya, babe.", threadID, messageID);
  }
};
