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
  version: "1.0.0",
  permission: 0,
  credits: "Bogart Magalapok",
  description: "AI girlfriend auto-replies when trigger words are detected using Ashley API.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "Type any trigger word (e.g. babe, ashley, mahal...)",
  cooldowns: 0 // custom cooldown used instead
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply, isGroup } = event;

  // Ignore non-text/empty messages
  if (!body || typeof body !== "string") return;

  // Fetch bot's own ID (safe-guard)
  let botID;
  try {
    botID = api.getCurrentUserID();
  } catch (err) {
    console.warn("⚠️ Couldn't fetch bot ID:", err);
    return;
  }

  // Don't reply to self or if the message is a reply to bot
  if (senderID === botID) return;
  if (messageReply && messageReply.senderID === botID) return;

  // Check for trigger words (case-insensitive)
  const lowerBody = body.toLowerCase();
  if (!triggerWords.some(word => lowerBody.includes(word))) return;

  // Per-user cooldown (6 seconds)
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

    // Basic safety filter: block content that mentions children/minors
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

    // Trim if too long for messenger
    if (replyText.length > 1900) replyText = replyText.slice(0, 1900) + "\n\n... (trimmed)";

    const final = ` •| 𝙰𝚂𝙷𝙻𝙴𝚈 |•\n\n${replyText}\n\n•| 𝙰𝙸 - 𝙶𝙸𝚁𝙻𝙵𝚁𝙸𝙴𝙽𝙳  |•`;

    return api.sendMessage(final, threadID, messageID);
  } catch (error) {
    console.error("❌ Ashley API Error:", error?.response?.data || error?.message || error);
    return api.sendMessage("❌ May problema sa Ashley API. Subukan ulit mamaya, babe.", threadID, messageID);
  }
};

module.exports.run = () => {
  // Event-based module — no direct run command
};
