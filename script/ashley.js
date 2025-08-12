const axios = require("axios");

// Cooldown storage (per user)
const textCooldowns = new Map();

// Trigger words (lowercase)
const triggerWords = [
  "babe",
  "ash",
  "ashley",
  "mahal",
  "love",
  "sexy",
  "ganda"
];

module.exports.config = {
  name: "ashley",
  version: "1.0.2",
  permission: 0,
  credits: "Bogart Magalapok + ChatGPT",
  description: "AI girlfriend auto-replies when trigger words are detected using Ashley API.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "Type any trigger word (e.g. babe, ashley, mahal...)",
  cooldowns: 0 // custom cooldown used instead
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply, isGroup } = event;

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
  if (messageReply && messageReply.senderID === botID) return;

  const lowerBody = body.toLowerCase().trim();

  // 📌 Usage/help trigger if message starts with "ashley"
  if (/^ashley(\s|$|\?|help|-)/.test(lowerBody)) {
    return api.sendMessage(
      "💖 **Ashley AI – Usage Guide**\n\n" +
      "To talk to Ashley, just include any of these words in your message:\n" +
      "• babe\n• ash\n• ashley\n• mahal\n• love\n• sexy\n• ganda\n\n" +
      "💬 Example:\n" +
      "`Hi babe, kumain ka na?`\n" +
      "`Ashley, miss mo na ba ako?`\n\n" +
      "💡 Tip: Works in DMs, or in groups if the bot is an admin.",
      threadID,
      messageID
    );
  }

  // 📌 Restriction: Block in groups unless bot is admin
  if (isGroup) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const isAdmin = threadInfo.adminIDs.some(a => a.id == botID);
      if (!isAdmin) {
        return api.sendMessage(
          "⚠️ This command is locked. Make me an admin in the group to unlock it.",
          threadID,
          messageID
        );
      }
    } catch (err) {
      console.error("❌ Failed to check admin status:", err);
      return;
    }
  }

  // Trigger word check
  if (!triggerWords.some(word => lowerBody.includes(word))) return;

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
  const question = body.trim();

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
    const loweredReply = replyText.toLowerCase();
    const blockedPatterns = /(bata|child|minor|underage|under-age|kinder|anak)/i;
    if (blockedPatterns.test(loweredReply)) {
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

module.exports.run = () => {};
