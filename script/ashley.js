const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map();
// Local cache to avoid repeated API calls for same questions
const ashleyCache = new Map();

module.exports.config = {
  name: "ashley",
  version: "1.1.0-ghost",
  permission: 0,
  credits: "Bogart Magalapok + ChatGPT (ghost mod)",
  description: "AI girlfriend with stealth API pattern.",
  prefix: false,
  category: "without prefix",
  usage: "ashley <question>"
};

const smallTalks = [
  "Hmm… give me a sec, babe.",
  "Wait lang, iniisip ko pa.",
  "Haha, interesting question.",
  "Saglit lang mahal, processing…"
];

// Multiple API mirrors (same backend)
const API_MIRRORS = [
  "https://markdevs-last-api-p2y6.onrender.com/ashley",
  "https://markdevs-last-api-p2y6-mirror1.onrender.com/ashley",
  "https://markdevs-last-api-p2y6-mirror2.onrender.com/ashley"
];

// Function to pick a random mirror
function pickApiUrl() {
  return API_MIRRORS[Math.floor(Math.random() * API_MIRRORS.length)];
}

// Fake harmless requests to mask traffic (Google favicon, GitHub raw file)
async function sendFillerRequest() {
  const fillers = [
    "https://www.google.com/favicon.ico",
    "https://raw.githubusercontent.com/github/explore/main/topics/javascript/javascript.png"
  ];
  try {
    await axios.get(fillers[Math.floor(Math.random() * fillers.length)], { timeout: 3000 });
  } catch {}
}

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, isGroup } = event;
  if (!body || typeof body !== "string") return;

  let botID;
  try { botID = api.getCurrentUserID(); } catch { return; }
  if (senderID === botID) return;

  const trimmed = body.trim();
  const lowerTrimmed = trimmed.toLowerCase();

  if (lowerTrimmed === "ashley") {
    return api.sendMessage(
      "💡 Usage: `ashley <question>`\nExample: `ashley kumusta ka?`",
      threadID,
      messageID
    );
  }

  if (!lowerTrimmed.startsWith("ashley ")) return;

  if (isGroup) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 Locked! Make me admin muna bago magamit si Ashley dito.", threadID, messageID);
      }
    } catch {}
  }

  // Cooldown with random jitter
  const now = Date.now();
  const cooldownTime = 5000 + Math.floor(Math.random() * 2000);
  if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Babe, wait ka muna ng ${timeLeft} segundo.`, threadID, messageID);
  }
  textCooldowns.set(senderID, now);

  // Simulate typing
  await new Promise(res => {
    api.sendTypingIndicator(threadID, true);
    setTimeout(res, 1000 + Math.floor(Math.random() * 2000));
  });

  const question = trimmed.substring(7).trim();

  // 25% chance to send small talk instead of API
  if (Math.random() < 0.25) {
    return api.sendMessage(smallTalks[Math.floor(Math.random() * smallTalks.length)], threadID, messageID);
  }

  // Check local cache
  if (ashleyCache.has(question)) {
    return api.sendMessage(ashleyCache.get(question), threadID, messageID);
  }

  // Send a filler request in background
  sendFillerRequest();

  // Add random delay before calling API
  await new Promise(res => setTimeout(res, 300 + Math.floor(Math.random() * 1200)));

  const API_URL = `${pickApiUrl()}?prompt=${encodeURIComponent(question)}&uid=${encodeURIComponent(senderID)}`;

  try {
    const res = await axios.get(API_URL, { timeout: 20000 });
    let replyText = typeof res.data === "string"
      ? res.data
      : res.data?.response || res.data?.data?.response || JSON.stringify(res.data);

    const blockedPatterns = /(bata|child|minor|underage|under-age|kinder|anak)/i;
    if (blockedPatterns.test(replyText.toLowerCase())) {
      return api.sendMessage("⚠️ Hindi ko pwedeng sagutin yan, mahal.", threadID, messageID);
    }

    if (replyText.length > 1900) replyText = replyText.slice(0, 1900) + "\n\n... (trimmed)";

    const formats = [
      `•| 𝘼𝙨𝙝𝙡𝙚𝙮 |•\n\n${replyText}`,
      `${replyText}\n\n— 𝘼𝙨𝙝𝙡𝙚𝙮`,
      `💬 Ashley says:\n${replyText}`
    ];
    const final = formats[Math.floor(Math.random() * formats.length)];

    // Cache the result for 5 minutes
    ashleyCache.set(question, final);
    setTimeout(() => ashleyCache.delete(question), 5 * 60 * 1000);

    return api.sendMessage(final, threadID, messageID);

  } catch {
    return api.sendMessage("❌ May problema sa Ashley API. Try again later, babe.", threadID, messageID);
  }
};
