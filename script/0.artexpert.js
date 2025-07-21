const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "",
  version: "1.0.3",
  role: 0,
  credits: "ChatGPT",
  aliases: [],
  usages: "< Facebook UID >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const uid = args[0];
  const filePath = __dirname + `/cache/art-expert.png`;

  if (!uid || isNaN(uid)) {
    return api.sendMessage("❌ Please provide a valid Facebook UID.\n\nExample: artexpert 100044848836284", threadID, messageID);
  }

  try {
    api.sendMessage("🎨 Fetching art expert image, please wait...", threadID, messageID);

    // API directly returns image, not JSON
    const imageUrl = `https://api-canvass.vercel.app/art-expert?userid=${uid}`;
    const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    fs.writeFileSync(filePath, Buffer.from(imageBuffer, "utf-8"));

    api.sendMessage({
      body: `🖼️ Art Expert result for UID: ${uid}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error fetching image: ${error.message}`, threadID, messageID);
  }
};
