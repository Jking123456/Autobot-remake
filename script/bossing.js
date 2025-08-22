const axios = require("axios");

module.exports.config = {
  name: "bossing",
  version: "1.0.5-ghost",
  permission: 0,
  credits: "Bogart Magalapok + ChatGPT (ghost mod)",
  description: "Bossing AI auto-reply bot (DM only, pure API).",
  prefix: false,
  category: "without prefix",
  usage: "Just DM me anything"
};

// Single API endpoint
const API_URL = "https://markdevs-last-api-p2y6.onrender.com/bossing";

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

  try {
    const res = await axios.get(
      `${API_URL}?prompt=${encodeURIComponent(question)}&uid=${encodeURIComponent(senderID)}`,
      { timeout: 15000 }
    );

    let replyText = res.data?.response || res.data?.data?.response || JSON.stringify(res.data);

    if (replyText && typeof replyText === "string") {
      if (replyText.length > 1800) replyText = replyText.slice(0, 1800) + "\n\n... (trimmed)";
      return api.sendMessage(replyText, threadID, messageID);
    }

    return api.sendMessage("❌ Walang valid response si Bossing.", threadID, messageID);

  } catch (err) {
    console.error("Bossing API error:", err.message || err);
    return api.sendMessage("❌ Error sa Bossing API. Try ulit mamaya.", threadID, messageID);
  }
};
