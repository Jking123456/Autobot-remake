const axios = require("axios");

module.exports.config = {
  name: "bossing",
  version: "1.0.3-ghost",
  permission: 0,
  credits: "Bogart Magalapok + ChatGPT (ghost mod)",
  description: "Bossing AI auto-reply bot (DM only, pure API).",
  prefix: false,
  category: "without prefix",
  usage: "Just DM me anything"
};

// API mirrors
const API_MIRRORS = [
  "https://markdevs-last-api-p2y6.onrender.com/bossing",
  "https://markdevs-last-api-p2y6-mirror1.onrender.com/bossing",
  "https://markdevs-last-api-p2y6-mirror2.onrender.com/bossing"
];

// Function to pick a random mirror
function pickApiUrl() {
  return API_MIRRORS[Math.floor(Math.random() * API_MIRRORS.length)];
}

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, isGroup } = event;
  if (!body || typeof body !== "string") return;

  let botID;
  try { botID = api.getCurrentUserID(); } catch { return; }
  if (senderID === botID) return;

  // ❌ Reject group chats — DM only
  if (isGroup) return;

  const question = body.trim();
  if (!question) return;

  // Simulate typing
  await new Promise(res => {
    api.sendTypingIndicator(threadID, true);
    setTimeout(res, 500 + Math.floor(Math.random() * 1000));
  });

  const API_URL = `${pickApiUrl()}?prompt=${encodeURIComponent(question)}&uid=${encodeURIComponent(senderID)}`;

  try {
    const res = await axios.get(API_URL, { timeout: 20000 });
    let replyText = res.data?.response || res.data?.data?.response || JSON.stringify(res.data);

    if (replyText.length > 1800) replyText = replyText.slice(0, 1800) + "\n\n... (trimmed)";

    return api.sendMessage(replyText, threadID, messageID);

  } catch {
    return api.sendMessage("❌ Error sa Bossing API. Try ulit mamaya.", threadID, messageID);
  }
};
