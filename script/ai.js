const axios = require("axios");

// Cooldown storage
const imageCooldowns = new Map();
const textCooldowns = new Map();

module.exports.config = {
  name: "ai",
  version: "1.2.8",
  permission: 0,
  credits: "Homer Rebatis",
  description: "Ask AI via Kaiz Gemini Vision (image) or Kaiz-AI (text only).",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "ai <question> | reply to image",
  cooldowns: 0,
  dependency: {
    "axios": ""
  }
};

// ✅ Only allowed users if bot is not admin
const ALLOWED_USERS_IF_NOT_ADMIN = ["100044848836284"];

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, messageReply, senderID } = event;

  let botIsAdmin = false;

  // ✅ Check if bot is admin in this thread
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    botIsAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
  } catch (err) {
    console.error("❌ Failed to check bot admin status:", err);
    return api.sendMessage("⚠️ Couldn't verify bot permissions. Try again later.", threadID, messageID);
  }

  // 🚫 If bot is NOT admin and sender is NOT allowed
  if (!botIsAdmin && !ALLOWED_USERS_IF_NOT_ADMIN.includes(senderID)) {
    return api.sendMessage(
      `🚫 You are not authorized to use this command.\n\nReason:\n• Bot is not an admin in this group.\n• You are not on the allowed user list.`,
      threadID,
      messageID
    );
  }

  const TEXT_API = "https://betadash-api-swordslush.vercel.app/gpt4";
  const IMAGE_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
  const IMAGE_API_KEY = "25644cdb-f51e-43f1-894a-ec718918e649";
  const UID = Math.floor(Math.random() * 1000000).toString();

  const question = args.join(" ").trim();
  let imageUrl = null;

  if (messageReply && messageReply.attachments.length > 0) {
    const attachment = messageReply.attachments[0];
    if (attachment.type === "photo" && attachment.url) {
      imageUrl = attachment.url;
    } else {
      return api.sendMessage("❌ Please reply to a valid photo.", threadID, messageID);
    }
  }

  const now = Date.now();
  const cooldownTime = 10 * 1000;

  try {
    if (imageUrl) {
      if (imageCooldowns.has(senderID) && now - imageCooldowns.get(senderID) < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (now - imageCooldowns.get(senderID))) / 1000);
        return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before using the AI image again.`, threadID, messageID);
      }

      imageCooldowns.set(senderID, now);

      const imageParams = new URLSearchParams({
        q: question || "What’s in this image?",
        uid: UID,
        imageUrl: imageUrl,
        apikey: IMAGE_API_KEY
      });

      const res = await axios.get(`${IMAGE_API}?${imageParams.toString()}`);
      const result = res?.data?.response;

      if (!result) {
        return api.sendMessage("⚠️ No response received from the image AI API.", threadID, messageID);
      }

      return api.sendMessage(
        `•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃 (𝙸𝙼𝙰𝙶𝙴) |•\n\n${result}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`,
        threadID,
        messageID
      );
    }

    if (!question) {
      return api.sendMessage("🧠 Please enter a question or reply to an image. Example: ai what is matter?", threadID, messageID);
    }

    if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
      const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
      return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before using the AI text again.`, threadID, messageID);
    }

    textCooldowns.set(senderID, now);

    const res = await axios.get(`${TEXT_API}?ask=${encodeURIComponent(question)}`);
    const result = res?.data?.content;

    if (!result) {
      return api.sendMessage("⚠️ No response received from the text AI API.", threadID, messageID);
    }

    return api.sendMessage(
      `•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃 |•\n\n${result}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ AI Error:", error?.response?.data || error.message || error);
    return api.sendMessage("❌ An error occurred while processing your request. Please try again later.", threadID, messageID);
  }
};
