const axios = require('axios');
const fs = require('fs-extra');

const cooldowns = new Map(); // Tracks senderID cooldowns

module.exports.config = {
  name: "poli",
  version: "1.0.0",
  role: 0,
  credits: "Homer Rebatis",
  aliases: ["aiimage", "polli"],
  usages: "<prompt>",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const prompt = args.join(" ");
  const filePath = __dirname + `/cache/poli.png`;

  // ✅ Admin check for group
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 𝐋𝐨𝐜𝐤𝐞𝐝! 𝐌𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝.",
          threadID,
          messageID
        );
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Failed to verify admin status. Try again later.", threadID, messageID);
  }

  // ⏳ Cooldown check
  const cooldownTime = 10 * 1000; // 10 seconds
  const lastUsed = cooldowns.get(senderID);
  const now = Date.now();

  if (lastUsed && now - lastUsed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
    return api.sendMessage(
      `⏳ Please wait ${timeLeft} seconds before using "poli" again.`,
      threadID,
      messageID
    );
  }

  if (!prompt) {
    return api.sendMessage(
      "❌ Please provide a prompt for the image generation.\n\nExample: poli a black cat with red eyes",
      threadID,
      messageID
    );
  }

  try {
    cooldowns.set(senderID, now); // Set cooldown
    api.sendMessage("🎨 Generating image from prompt, please wait...", threadID, messageID);

    const apiKey = "63fafad1-e326-432c-85f6-54b505835e72"; // your Poli API key
    const imageUrl = `https://kaiz-apis.gleeze.com/api/poli?prompt=${encodeURIComponent(prompt)}&apikey=${apiKey}`;
    
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
