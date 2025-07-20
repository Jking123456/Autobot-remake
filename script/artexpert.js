const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "artexpert",
  version: "1.0.2",
  role: 0,
  credits: "ChatGPT",
  aliases: [],
  usages: "< Facebook UID >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const filePath = __dirname + `/cache/art-expert.png`;

  // Get the UID from args
  const uid = args[0];

  if (!uid || isNaN(uid)) {
    return api.sendMessage("❌ Please provide a valid Facebook UID.\n\nExample: artexpert 100044848836284", threadID, messageID);
  }

  try {
    api.sendMessage("🎨 Fetching art expert result, please wait...", threadID, messageID);

    // Make API request
    const apiUrl = `https://api-canvass.vercel.app/art-expert?userid=${uid}`;
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.image) {
      return api.sendMessage("❌ API did not return an image. Please try again with a valid UID.", threadID, messageID);
    }

    // Download the image
    const imageBuffer = (await axios.get(response.data.image, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(filePath, Buffer.from(imageBuffer, "utf-8"));

    // Send the result
    api.sendMessage({
      body: `🖼️ Art Expert result for UID: ${uid}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
