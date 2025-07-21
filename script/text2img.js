const axios = require('axios');
const fs = require('fs-extra');

const cooldowns = new Map(); // Tracks senderID cooldowns

module.exports.config = {
  name: "text2img",
  version: "1.0.0",
  role: 0,
  credits: "Homer Rebatis",
  aliases: [],
  usages: "<prompt>",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const prompt = args.join(" ");
  const filePath = __dirname + `/cache/text2img.png`;

  // Cooldown check
  const cooldownTime = 60 * 3000; // 1 minute in ms
  const lastUsed = cooldowns.get(senderID);
  const now = Date.now();

  if (lastUsed && now - lastUsed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before using "text2img" again.`, threadID, messageID);
  }

  if (!prompt) {
    return api.sendMessage("❌ Please provide a prompt for the image generation.\n\nExample: text2img a goat playing guitar in space", threadID, messageID);
  }

  try {
    cooldowns.set(senderID, now); // Set cooldown
    api.sendMessage("🎨 Generating image from prompt, please wait...", threadID, messageID);

    const imageUrl = `https://kaiz-apis.gleeze.com/api/text2image?prompt=${encodeURIComponent(prompt)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;
    const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    fs.writeFileSync(filePath, Buffer.from(imageBuffer, "utf-8"));

    api.sendMessage({
      body: `🖼️ Image generated from prompt: "${prompt}"`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error generating image: ${error.message}`, threadID, messageID);
  }
};
