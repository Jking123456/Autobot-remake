const axios = require('axios');
const fs = require('fs-extra');

const cooldowns = new Map(); // cooldown map per senderID

module.exports.config = {
  name: "zombie",
  version: "1.0.0",
  role: 0,
  credits: "Homer Rebatis",
  aliases: [],
  usages: "< Facebook UID >",
  cooldown: 2,
};

// Pick random element from array
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const uid = args[0];
  const filePath = __dirname + `/cache/zombie-${Date.now()}.png`;

  // ✅ Restrict to admin-only in groups
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 Bot must be an admin to run this command in a group.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Couldn't verify bot permissions. Please try again later.", threadID, messageID);
  }

  // ⏳ Cooldown check (1 min)
  const now = Date.now();
  if (cooldowns.has(senderID)) {
    const elapsed = now - cooldowns.get(senderID);
    if (elapsed < 60 * 1000) {
      const waitTime = Math.ceil((60 * 1000 - elapsed) / 1000);
      return api.sendMessage(`⏳ Please wait ${waitTime} second(s) before using this again.`, threadID, messageID);
    }
  }

  if (!uid || isNaN(uid)) {
    return api.sendMessage("❌ Please provide a valid Facebook UID.\nExample: zombie 100044848836284", threadID, messageID);
  }

  try {
    cooldowns.set(senderID, now);

    // Simulate human typing
    api.sendTypingIndicator(threadID, true);

    // Random delay before intro (1–3 sec)
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Random intro messages
    const introMsgs = [
      "🧟‍♂️ Summoning the undead...",
      "⚰️ Digging up something creepy...",
      "🩸 Brewing your zombie transformation...",
      "💀 Hold tight, your zombie version is coming..."
    ];
    api.sendMessage(pickRandom(introMsgs), threadID, messageID);

    // Fetch zombie image
    const imageUrl = `https://api-canvass.vercel.app/zombie?userid=${uid}`;
    const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(filePath, Buffer.from(imageBuffer));

    // Short delay before sending result
    const resultDelay = Math.floor(Math.random() * 1500) + 500;
    await new Promise(resolve => setTimeout(resolve, resultDelay));

    // Random result messages
    const resultMsgs = [
      `🧟 Finished! Here’s the zombie version of UID: ${uid}`,
      `💀 All done! Your undead self is ready for UID: ${uid}`,
      `⚰️ Zombie transformation complete for UID: ${uid}`,
      `🩸 Here’s your terrifying zombie form for UID: ${uid}`
    ];

    api.sendMessage({
      body: pickRandom(resultMsgs),
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

    api.sendTypingIndicator(threadID, false);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error fetching zombie image: ${error.message}`, threadID, messageID);
    api.sendTypingIndicator(threadID, false);
  }
};

