const axios = require('axios');
const fs = require('fs-extra');

const cooldowns = new Map(); // cooldown map per senderID

module.exports.config = {
  name: "artist",
  version: "1.0.0",
  role: 0,
  credits: "ChatGPT",
  aliases: [],
  usages: "< Facebook UID >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const uid = args[0];
  const filePath = __dirname + `/cache/artist.png`;

  // ✅ Restrict to admin-only in groups
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command can only be used in groups where the bot is an admin.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Couldn't verify bot permissions. Try again later.", threadID, messageID);
  }

  // 1-minute cooldown check
  const now = Date.now();
  if (cooldowns.has(senderID)) {
    const elapsed = now - cooldowns.get(senderID);
    if (elapsed < 60 * 1000) {
      const waitTime = Math.ceil((10 * 1000 - elapsed) / 1000);
      return api.sendMessage(`⏳ Please wait ${waitTime} second(s) before using this command again.`, threadID, messageID);
    }
  }

  if (!uid || isNaN(uid)) {
    return api.sendMessage("❌ Please provide a valid Facebook UID.\n\nExample: artist 100044848836284", threadID, messageID);
  }

  try {
    cooldowns.set(senderID, now); // Set cooldown start time
    api.sendMessage("🎭 Creating artistic image, please wait...", threadID, messageID);

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
