const axios = require('axios');
const fs = require('fs-extra');

const cooldowns = new Map(); // Store cooldowns per senderID

module.exports.config = {
  name: "artexpert",
  version: "1.0.3",
  role: 0,
  credits: "Homer Rebatis",
  aliases: [],
  usages: "< Facebook UID >",
  cooldown: 2, // general system cooldown (optional)
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const uid = args[0];
  const filePath = __dirname + `/cache/art-expert.png`;

  // ✅ Restrict group usage unless bot is admin
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Failed to verify bot permissions. Try again later.", threadID, messageID);
  }

  // Cooldown check
  const now = Date.now();
  if (cooldowns.has(senderID)) {
    const timePassed = now - cooldowns.get(senderID);
    if (timePassed < 120 * 1000) {
      const remaining = Math.ceil((60 * 1000 - timePassed) / 1000);
      return api.sendMessage(`⏳ Please wait ${remaining} second(s) before using this command again.`, threadID, messageID);
    }
  }

  if (!uid || isNaN(uid)) {
    return api.sendMessage("❌ Please provide a valid Facebook UID.\n\nExample: artexpert 100044848836284", threadID, messageID);
  }

  try {
    cooldowns.set(senderID, now); // Set cooldown after passing checks
    api.sendMessage("🎨 Fetching art expert image, please wait...", threadID, messageID);

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
