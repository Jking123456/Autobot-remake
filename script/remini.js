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
  const messageReply = event.messageReply;

  if (
    !messageReply || 
    !messageReply.attachments || 
    messageReply.attachments.length === 0 || 
    messageReply.attachments[0].type !== "photo"
  ) {
    return api.sendMessage("📸 Please reply to a photo to enhance it.", event.threadID, event.messageID);
  }

  const photoUrl = messageReply.attachments[0].url;

  // Send loading message
  const loadingMessage = await api.sendMessage("⏳ Enhancing image, please wait...", event.threadID);

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
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error("Remini Error:", err);

    // Delete loading message
    api.unsendMessage(loadingMessage.messageID);

    // Send error message
    return api.sendMessage(`❌ Failed to enhance image.\n${err.message}`, event.threadID, event.messageID);
  }
};
