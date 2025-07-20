const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "art",
  version: "1.0.0",
  role: 0,
  credits: "Homer Rebatis",
  aliases: [],
  usages: "< user id >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const userId = args[0] || senderID;
  const filePath = __dirname + `/cache/art-expert.png`;

  try {
    api.sendMessage("🎨 Fetching art analysis, please wait...", threadID, messageID);

    // Fetch from the API
    const apiUrl = `https://api-canvass.vercel.app/art-expert?userid=${encodeURIComponent(userId)}`;
    const response = await axios.get(apiUrl);

    // Check if response contains expected data
    if (!response.data || !response.data.image) {
      return api.sendMessage("❌ No image found in the API response.", threadID, messageID);
    }

    // Download the image
    const imageBuffer = (await axios.get(response.data.image, { responseType: 'arraybuffer' })).data;
    fs.writeFileSync(filePath, Buffer.from(imageBuffer, 'utf-8'));

    // Send the image
    api.sendMessage({
      body: "🖼️ Here's your art expert analysis:",
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error fetching data: ${error.message}`, threadID, messageID);
  }
};
