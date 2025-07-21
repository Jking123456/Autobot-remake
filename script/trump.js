const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "trump",
  version: "1.0.0",
  role: 0,
  credits: "Homer Rebatis",
  aliases: [],
  usages: "< Facebook UID > < text >\nExample: trump 100044848836284 bakla",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const uid = args[0];
  const text = args.slice(1).join(" ");
  const filePath = __dirname + `/cache/trump.png`;

  if (!uid || isNaN(uid) || !text) {
    return api.sendMessage("❌ Please provide a valid Facebook UID **and** text.\n\nExample: trump 100044848836284 bakla", threadID, messageID);
  }

  try {
    api.sendMessage("🇺🇸 Generating Trump image, please wait...", threadID, messageID);

    const apiUrl = `https://api-canvass.vercel.app/trump?userid=${uid}&text=${encodeURIComponent(text)}`;
    const imageBuffer = (await axios.get(apiUrl, { responseType: "arraybuffer" })).data;

    fs.writeFileSync(filePath, Buffer.from(imageBuffer, "utf-8"));

    api.sendMessage({
      body: `🧠 Trump says: "${text}"`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error fetching Trump image: ${error.message}`, threadID, messageID);
  }
};
