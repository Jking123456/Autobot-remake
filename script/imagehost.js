const axios = require("axios");

const cooldowns = new Map();

module.exports.config = {
  name: "imagehost",
  version: "1.0.1",
  role: 0,
  credits: "Homer Rebatis",
  aliases: ["imgup", "hostimg"],
  usages: "<reply with an image>",
  cooldown: 3,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID, type, messageReply } = event;

  // ✅ Restrict to bot-admin only in groups
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 Bot must be an admin to use the 'imagehost' command in this group.",
          threadID,
          messageID
        );
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage(
      "⚠️ Couldn't verify bot permissions. Please try again later.",
      threadID,
      messageID
    );
  }

  // ✅ Require reply with image
  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage(
      "❌ Please reply to an image to upload it.\n\nExample: reply to a photo with `imagehost`",
      threadID,
      messageID
    );
  }

  const imageUrl = messageReply.attachments[0].url;

  // ⏳ Cooldown check (15s per user)
  const now = Date.now();
  if (cooldowns.has(senderID)) {
    const elapsed = now - cooldowns.get(senderID);
    if (elapsed < 15 * 1000) {
      const waitTime = Math.ceil((15 * 1000 - elapsed) / 1000);
      return api.sendMessage(
        `⏳ Please wait ${waitTime} seconds before using "imagehost" again.`,
        threadID,
        messageID
      );
    }
  }

  try {
    cooldowns.set(senderID, now);
    api.sendMessage("☁️ Uploading your image, please wait...", threadID, messageID);

    const apiKey = "63fafad1-e326-432c-85f6-54b505835e72";
    const apiUrl = `https://kaiz-apis.gleeze.com/api/freeimagehost?imageUrl=${encodeURIComponent(imageUrl)}&apikey=${apiKey}`;

    const res = await axios.get(apiUrl);

    if (!res.data || !res.data.url) {
      return api.sendMessage("❌ Failed to host the image. Try again later.", threadID, messageID);
    }

    const { url, size, width, height } = res.data;

    api.sendMessage(
      `✅ Image hosted successfully!\n\n📎 URL: ${url}\n📏 Size: ${size}\n🖼 Resolution: ${width}x${height}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error hosting image: ${error.message}`, threadID, messageID);
  }
};
