'use strict';

const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
  try {
    // Must be a reply to a message with 2 photos
    if (event.type !== "message_reply") return api.sendMessage("❗ Please reply to two images.", event.threadID);

    const attachments = event.messageReply.attachments;
    if (!attachments || attachments.length !== 2)
      return api.sendMessage("❗ You must reply to exactly 2 images.", event.threadID);

    const [baseImage, swapImage] = attachments;

    if (baseImage.type !== "photo" || swapImage.type !== "photo")
      return api.sendMessage("❗ Both attachments must be images.", event.threadID);

    const baseUrl = encodeURIComponent(baseImage.url);
    const swapUrl = encodeURIComponent(swapImage.url);

    // Kaiz Faceswap API
    const apiUrl = `https://kaiz-apis.gleeze.com/api/faceswap?baseUrl=${baseUrl}&swapUrl=${swapUrl}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

    const res = await axios.get(apiUrl, { responseType: 'arraybuffer' });

    const filePath = path.join(__dirname, '..', 'cache', `faceswap_${Date.now()}.png`);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'binary'));

    return api.sendMessage({
      body: "✅ Face swap complete!",
      attachment: fs.createReadStream(filePath)
    }, event.threadID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error: " + error.message, event.threadID);
  }
};
