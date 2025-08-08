const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map();

module.exports.config = {
  name: "malupiton",
  version: "1.0.0",
  permission: 0,
  credits: "You",
  description: "Goat bot (Malupiton) — talks like a certified kupal using the Bossing API.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "malupiton <message>",
  cooldowns: 0, // using custom cooldown below
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  // Prevent bot replying to itself
  try {
    const botID = api.getCurrentUserID();
    if (senderID === botID) return; // message from the bot itself
    if (messageReply && messageReply.senderID === botID) return; // replying to a bot message
  } catch (err) {
    // If api.getCurrentUserID fails for some reason, just continue (non-fatal)
    console.warn("Couldn't fetch bot ID:", err);
  }

  // Basic admin-only option: (uncomment to enforce group-admin-only usage)
  // try {
  //   const threadInfo = await api.getThreadInfo(threadID);
  //   const botID = api.getCurrentUserID();
  //   const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
  //   if (!isBotAdmin) return api.sendMessage("🚫 Make me an admin first so I can run here, Bossing.", threadID, messageID);
  // } catch (err) {
  //   console.warn("Thread info check failed:", err);
  // }

  const API_BASE = "https://markdevs-last-api-p2y6.onrender.com/bossing";
  // create a UID to send (the API you provided used uid=1 in the example — randomize or set static if you prefer)
  const UID = Math.floor(Math.random() * 1000000).toString();

  const question = args.join(" ").trim();

  const now = Date.now();
  const cooldownTime = 6 * 1000; // 6 seconds per user
  if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Hoy, maghintay ka ng ${timeLeft} segundo muna bago magpadala ulit, Bossing.`, threadID, messageID);
  }
  textCooldowns.set(senderID, now);

  try {
    // Build request URL. The API accepts prompt and uid (example you provided had prompt=&uid=1)
    const url = `${API_BASE}?prompt=${encodeURIComponent(question)}&uid=${encodeURIComponent(UID)}`;

    const res = await axios.get(url, { timeout: 20000 });
    const data = res?.data;

    // The example JSON you gave returns { "status": true, "response": "..." }
    let replyText = "";

    if (data) {
      if (typeof data === "string") {
        // If API returns raw string
        replyText = data;
      } else if (data.response) {
        replyText = data.response;
      } else if (data.data && data.data.response) {
        replyText = data.data.response;
      } else {
        replyText = JSON.stringify(data);
      }
    } else {
      replyText = "⚠️ Walang nakuha na sagot mula sa Bossing API.";
    }

    // Optional cleanup: ensure the reply is a string and not too long
    if (typeof replyText !== "string") replyText = String(replyText);
    if (replyText.length > 1900) replyText = replyText.slice(0, 1900) + "\n\n... (trimmed)";

    // Final message format — goat/kapal vibe
    const final = `🦙 •| 𝙼𝙰𝙻𝚄𝙿𝙸𝚃𝙾𝙽  |•\n\n${replyText}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`;

    return api.sendMessage(final, threadID, messageID);
  } catch (error) {
    console.error("❌ Malupiton API Error:", error?.response?.data || error?.message || error);
    return api.sendMessage("❌ May problema sa Bossing API. Subukan ulit mamaya, Bossing.", threadID, messageID);
  }
};
