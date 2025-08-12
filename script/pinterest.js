const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const cooldowns = new Map(); // Track sender cooldowns

module.exports.config = {
  name: "pinterest",
  version: "1.0.0",
  role: 0,
  credits: "Homer Rebatis",
  description: "Search Pinterest images (returns 4 random results).",
  usages: "<keyword>",
  cooldown: 60, // seconds
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const search = args.join(" ");
  const cooldownTime = 1000 * 2000; // 1 minute in ms
  const now = Date.now();

  // 🔒 Restriction: Only allow in groups if bot is admin
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.",
          threadID,
          messageID
        );
      }
    }
  } catch (e) {
    console.error("Admin check error:", e);
    return api.sendMessage("⚠️ Failed to verify admin status. Try again later.", threadID, messageID);
  }

  // Cooldown logic
  const lastUsed = cooldowns.get(senderID);
  if (lastUsed && now - lastUsed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft}s before using "pinterest" again.`, threadID, messageID);
  }

  if (!search) {
    return api.sendMessage(`❌ Please enter a search keyword.\n\nExample: pinterest cat aesthetic`, threadID, messageID);
  }

  try {
    cooldowns.set(senderID, now); // Set new cooldown
    api.sendMessage(`🔍 Searching Pinterest for "${search}", please wait...`, threadID, messageID);

    const url = `https://kaiz-apis.gleeze.com/api/pinterest?search=${encodeURIComponent(search)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;
    const res = await axios.get(url);
    const data = res.data?.data;

    if (!data || data.length < 1) {
      return api.sendMessage("❌ No results found.", threadID, messageID);
    }

    const images = data.sort(() => 0.5 - Math.random()).slice(0, 4);
    const attachments = [];

    for (let i = 0; i < images.length; i++) {
      const imgBuffer = (await axios.get(images[i], { responseType: 'arraybuffer' })).data;
      const imgPath = path.join(__dirname, `cache/pin${i}.jpg`);
      fs.writeFileSync(imgPath, Buffer.from(imgBuffer, "utf-8"));
      attachments.push(fs.createReadStream(imgPath));
    }

    api.sendMessage({
      body: `📌 Pinterest results for: "${search}"`,
      attachment: attachments
    }, threadID, () => {
      for (let i = 0; i < 4; i++) {
        const file = path.join(__dirname, `cache/pin${i}.jpg`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
    }, messageID);

  } catch (err) {
    console.error(err);
    api.sendMessage(`❌ An error occurred: ${err.message}`, threadID, messageID);
  }
};
