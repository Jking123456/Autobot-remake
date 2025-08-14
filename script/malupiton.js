const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map();

module.exports.config = {
  name: "malupiton",
  version: "1.1.0",
  permission: 0,
  credits: "You + ChatGPT",
  description: "Bossing AI reply when message starts with 'malupiton <question>'. Safe for Meta detection.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "malupiton <question>",
  cooldowns: 6 // in seconds
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, isGroup, isE2EE } = event;

  if (!body || typeof body !== "string") return;

  // 🚫 Check for E2EE threads
  if (isE2EE) {
    return api.sendMessage(
      "🚫 This command cannot work in End-to-End Encrypted chats.",
      threadID,
      messageID
    );
  }

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

  // Show usage if only "malupiton" is typed
  if (lowerTrimmed === "malupiton") {
    return api.sendMessage(
      "📜 Usage: `malupiton <question>`\nExample: `malupiton sino ang pinakamalupit?`",
      threadID,
      messageID
    );
  }

  // Trigger only if message starts with "malupiton "
  if (!lowerTrimmed.startsWith("malupiton ")) return;

  // ✅ Check if bot is admin before allowing in group chats
  if (isGroup) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!botIsAdmin) {
        return api.sendMessage(
          "🚫 Locked! Make the bot admin to use this command in the group.",
          threadID,
          messageID
        );
      }
    } catch (err) {
      console.error("⚠️ Error checking admin status:", err);
      return api.sendMessage(
        "⚠️ Couldn't verify admin status. Please try again.",
        threadID,
        messageID
      );
    }
  }

  // Cooldown
  const now = Date.now();
  const cooldownTime = 6000;
  if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
    return api.sendMessage(
      `⏳ Wait ${timeLeft} second(s) before sending another question.`,
      threadID,
      messageID
    );
  }
  textCooldowns.set(senderID, now);

  // API Request
  const API_BASE = "https://markdevs-last-api-p2y6.onrender.com/bossing";
  const UID = Math.floor(Math.random() * 1000000).toString();
  const question = trimmed.substring(10).trim(); // remove "malupiton "

  try {
    const url = `${API_BASE}?prompt=${encodeURIComponent(question)}&uid=${encodeURIComponent(UID)}`;
    const res = await axios.get(url, { timeout: 20000 });
    const data = res?.data;

    // Extract response safely
    let replyText = "";
    if (typeof data === "string") replyText = data;
    else if (data.response) replyText = data.response;
    else if (data.data && data.data.response) replyText = data.data.response;
    else replyText = JSON.stringify(data);

    // Limit output length
    if (replyText.length > 1900) replyText = replyText.slice(0, 1900) + "\n\n... (trimmed)";

    // Placeholder for content filtering (optional)
    // replyText = filterUnsafeContent(replyText);

    const final = ` •| 𝙼𝙰𝙻𝚄𝙿𝙸𝚃𝙾𝙽  |•\n\n${replyText}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙰𝙽𝙾𝙽𝚈𝙼𝙾𝚄𝚂 𝙶𝚄𝚈 |•`;

    return api.sendMessage(final, threadID, messageID);
  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error?.message || error);
    return api.sendMessage(
      "❌ There was a problem with the Bossing API. Try again later.",
      threadID,
      messageID
    );
  }
};

module.exports.run = () => {};
