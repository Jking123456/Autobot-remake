const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "remini",
  version: "1.0.3",
  hasPermission: 0,
  credits: "Eugene Aguilar (Modified by Bogart)",
  description: "Enhance image using Remini API",
  commandCategory: "tools",
  usages: "[ reply a photo ]",
  cooldowns: 0,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  // ✅ Check if in a group and bot is admin
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command is disabled in this group because the bot is not an admin.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check error:", err);
    return api.sendMessage("⚠️ Unable to verify bot admin status. Try again later.", threadID, messageID);
  }

  const messageReply = event.messageReply;

  if (
    !messageReply || 
    !messageReply.attachments || 
    messageReply.attachments.length === 0 || 
    messageReply.attachments[0].type !== "photo"
  ) {
    return api.sendMessage("📸 Please reply to a photo to enhance it.", threadID, messageID);
  }

  const photoUrl = messageReply.attachments[0].url;

  // Send loading message
  const loadingMessage = await api.sendMessage("⏳ Enhancing image, please wait...", threadID);

  try {
    const apiURL = `https://kaiz-apis.gleeze.com/api/remini?url=${encodeURIComponent(photoUrl)}&stream=false&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;
    const { data } = await axios.get(apiURL);

    if (!data.response) throw new Error("No image returned from the API.");

    const imageBuffer = (await axios.get(data.response, { responseType: 'arraybuffer' })).data;
    const savePath = path.join(__dirname, 'cache', `enhanced_${Date.now()}.jpg`);

    fs.writeFileSync(savePath, Buffer.from(imageBuffer, 'binary'));

    // Delete loading message
    api.unsendMessage(loadingMessage.messageID);

    // Send final enhanced image
    return api.sendMessage({
      body: "✅ Image enhanced successfully!",
      attachment: fs.createReadStream(savePath)
    }, threadID, messageID);

  } catch (err) {
    console.error("Remini Error:", err);

    // Delete loading message
    api.unsendMessage(loadingMessage.messageID);

    return api.sendMessage(`❌ Failed to enhance image.\n${err.message}`, threadID, messageID);
  }
};
