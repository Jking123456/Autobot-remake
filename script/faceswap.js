'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const cooldowns = new Map(); // Cooldown tracker per senderID

module.exports.config = {
  name: "faceswap",
  hasPrefix: false,
  role: 0,
  hasPermission: false,
  commandCategory: "no prefix",
  usePrefix: false,
  cooldown: 5,
  aliases: ["swap"],
  description: "Face swap two images",
  usages: "reply to two images",
  credits: "Deku | Modified by Homer Rebatis"
};

module.exports.run = async function ({ api, event }) {
  const senderID = event.senderID;

  // ✅ Restrict usage in groups unless the bot is admin
  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 This command can only be used in groups where the bot is an admin.",
          event.threadID
        );
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Cannot check admin status. Try again later.", event.threadID);
  }

  // Fixed 1-minute cooldown check
  const now = Date.now();
  if (cooldowns.has(senderID)) {
    const timePassed = now - cooldowns.get(senderID);
    const cooldownTime = 10 * 1000;

    if (timePassed < cooldownTime) {
      return api.sendMessage(`⏳ Please wait 1 minute before using the \"faceswap\" command again.`, event.threadID);
    }
  }

  try {
    if (event.type !== "message_reply")
      return api.sendMessage("❗ Please reply to two images.", event.threadID);

    const attachments = event.messageReply.attachments;
    if (!attachments || attachments.length !== 2)
      return api.sendMessage("❗ You must reply to exactly 2 images.", event.threadID);

    const [baseImage, swapImage] = attachments;

    if (baseImage.type !== "photo" || swapImage.type !== "photo")
      return api.sendMessage("❗ Both attachments must be images.", event.threadID);

    const baseUrl = encodeURIComponent(baseImage.url);
    const swapUrl = encodeURIComponent(swapImage.url);

    const apiUrl = `https://kaiz-apis.gleeze.com/api/faceswap?baseUrl=${baseUrl}&swapUrl=${swapUrl}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

    const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });

    // Create cache folder if not exists
    const cacheDir = path.join(__dirname, '..', 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const filePath = path.join(cacheDir, `faceswap_${Date.now()}.png`);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'binary'));

    // Set cooldown
    cooldowns.set(senderID, now);

    return api.sendMessage({
      body: "✅ Face swap complete!",
      attachment: fs.createReadStream(filePath)
    }, event.threadID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error: " + error.message, event.threadID);
  }
};
