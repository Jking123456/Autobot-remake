const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map();

module.exports.config = {
  name: "malupiton",
  version: "1.0.5",
  permission: 0,
  credits: "You + ChatGPT",
  description: "Bossing AI reply when message starts with 'malupiton <question>'.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "malupiton <question>",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, isGroup } = event;
  if (!body || typeof body !== "string") return;

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
          "🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.",
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
      `⏳ Hoy, maghintay ka ng ${timeLeft} segundo muna bago magpadala ulit, Bossing.`,
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

    let replyText = "";
    if (typeof data === "string") replyText = data;
    else if (data.response) replyText = data.response;
    else if (data.data && data.data.response) replyText = data.data.response;
    else replyText = JSON.stringify(data);

    if (replyText.length > 1900) replyText = replyText.slice(0, 1900) + "\n\n... (trimmed)";

    const final = ` •| 𝙼𝙰𝙻𝚄𝙿𝙸𝚃𝙾𝙽  |•\n\n${replyText}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙰𝙽𝙾𝙽𝚈𝙼𝙾𝚄𝚂 𝙶𝚄𝚈 |•`;

    return api.sendMessage(final, threadID, messageID);
  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error?.message || error);
    return api.sendMessage(
      "❌ May problema sa Bossing API. Subukan ulit mamaya, Bossing.",
      threadID,
      messageID
    );
  }
};

module.exports.run = () => {};
