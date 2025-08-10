const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map();

// Auto-trigger if message ends with "." or "?"
module.exports.config = {
  name: "ai-autotrigger",
  version: "1.0.0",
  permission: 0,
  credits: "Homer Rebatis",
  description: "Auto AI reply if message ends with '.' or '?'. Also works with image replies.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "Just type a message ending with '.' or '?' or reply to an image",
  cooldowns: 0 // we handle custom cooldown
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  // Ignore empty or non-text messages
  if (!body || typeof body !== "string") return;

  // Fetch bot's own ID to avoid self-reply loops
  let botID;
  try {
    botID = api.getCurrentUserID();
  } catch (err) {
    console.warn("⚠️ Couldn't fetch bot ID:", err);
    return;
  }
  if (senderID === botID) return; // ignore bot's own messages
  if (messageReply && messageReply.senderID === botID) return; // ignore replies to bot

  const trimmed = body.trim();
  const endsWithTrigger = /[.?]$/.test(trimmed); // ends with . or ?

  // Check if message ends with . or ? or is an image reply
  let imageUrl = null;
  if (messageReply && messageReply.attachments.length > 0) {
    const attachment = messageReply.attachments[0];
    if (attachment.type === "photo" && attachment.url) {
      imageUrl = attachment.url;
    }
  }
  if (!endsWithTrigger && !imageUrl) return; // not a trigger

  // Cooldown check
  const now = Date.now();
  const cooldownTime = 10000; // 10 seconds
  if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before asking again.`, threadID, messageID);
  }
  textCooldowns.set(senderID, now);

  // API settings
  const TEXT_API = "https://betadash-api-swordslush.vercel.app/gpt4";
  const IMAGE_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
  const IMAGE_API_KEY = "25644cdb-f51e-43f1-894a-ec718918e649";
  const UID = Math.floor(Math.random() * 1000000).toString();

  try {
    let result;

    // IMAGE AI
    if (imageUrl) {
      const imageParams = new URLSearchParams({
        q: trimmed || "What’s in this image?",
        uid: UID,
        imageUrl: imageUrl,
        apikey: IMAGE_API_KEY
      });
      const res = await axios.get(`${IMAGE_API}?${imageParams.toString()}`, { timeout: 20000 });
      result = res?.data?.response || "⚠️ No response received from the image AI API.";
      return api.sendMessage(
        `•| 𝙰𝚂𝚂𝙸𝚂𝚃𝙰𝙽𝚃 - 𝙰𝙸 (𝙸𝙼𝙰𝙶𝙴) |•\n\n${result}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙰𝙽𝙾𝙽𝚈𝙼𝙾𝚄𝚂 𝙶𝚄𝚈 |•`,
        threadID,
        messageID
      );
    }

    // TEXT AI
    const res = await axios.get(`${TEXT_API}?ask=${encodeURIComponent(trimmed)}`, { timeout: 20000 });
    result = res?.data?.content || "⚠️ No response received from the text AI API.";

    return api.sendMessage(
      `•| 𝙰𝚂𝚂𝙸𝚂𝚃𝙰𝙽𝚃 - 𝙰𝙸 |•\n\n${result}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙰𝙽𝙾𝙽𝚈𝙼𝙾𝚄𝚂 𝙶𝚄𝚈 |•`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ AI Error:", error?.response?.data || error.message || error);
    return api.sendMessage("❌ An error occurred while processing your request. Please try again later.", threadID, messageID);
  }
};

module.exports.run = () => {
  // This command is purely event-based
};
