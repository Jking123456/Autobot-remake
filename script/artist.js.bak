const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "",
  version: "1.0.0",
  role: 0,
  credits: "ChatGPT",
  aliases: [],
  usages: "< Facebook UID >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const uid = args[0];
  const filePath = __dirname + `/cache/artist.png`;

  if (!uid || isNaN(uid)) {
    return api.sendMessage("❌ Please provide a valid Facebook UID.\n\nExample: artist 100044848836284", threadID, messageID);
  }

  try {
    api.sendMessage("🎭 Creating artistic image, please wait...", threadID, messageID);

    // API directly returns an image (not JSON)
    const imageUrl = `https://api-canvass.vercel.app/artist?userid=${uid}`;
    const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    fs.writeFileSync(filePath, Buffer.from(imageBuffer, "utf-8"));

    api.sendMessage({
      body: `🖌️ Artist result for UID: ${uid}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error fetching image: ${error.message}`, threadID, messageID);
  }
};
