const axios = require('axios');
const fs = require('fs-extra');

const cooldowns = new Map(); // Store cooldowns per senderID

module.exports.config = {
  name: "artexpert",
  version: "1.1.0",
  role: 0,
  credits: "Homer Rebatis (Modified for human-like behavior)",
  aliases: [],
  usages: "< Facebook UID >",
  cooldown: 2, // general system cooldown
};

// Function to get random element
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const uid = args[0];
  const filePath = __dirname + `/cache/art-expert-${Date.now()}.png`;

  // ✅ Restrict group usage unless bot is admin
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 Bot needs admin rights in this group to run this command.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Could not verify bot permissions. Please try again later.", threadID, messageID);
  }

  // Cooldown check
  const now = Date.now();
  if (cooldowns.has(senderID)) {
    const timePassed = now - cooldowns.get(senderID);
    if (timePassed < 120 * 1000) {
      const remaining = Math.ceil((120 * 1000 - timePassed) / 1000);
      return api.sendMessage(`⏳ Wait ${remaining} seconds before using this again.`, threadID, messageID);
    }
  }

  if (!uid || isNaN(uid)) {
    return api.sendMessage("❌ Please provide a valid Facebook UID.\nExample: artexpert 100044848836284", threadID, messageID);
  }

  try {
    cooldowns.set(senderID, now); // Set cooldown

    // Random delay to mimic human response time (1–3 seconds)
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Random intro messages
    const introMsgs = [
      "🎨 Let me work my magic...",
      "🖌️ Hold on, I’m crafting your art...",
      "📸 Fetching something special for you...",
      "✨ Just a sec, making it beautiful..."
    ];
    api.sendMessage(pickRandom(introMsgs), threadID, messageID);

    const imageUrl = `https://api-canvass.vercel.app/art-expert?userid=${uid}`;
    const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    fs.writeFileSync(filePath, Buffer.from(imageBuffer));

    // Random result messages
    const resultMsgs = [
      `🖼️ Here's your Art Expert result for UID: ${uid}`,
      `📷 Finished! Art generated for UID: ${uid}`,
      `✨ Done! Here’s the masterpiece for UID: ${uid}`
    ];

    // Another small random delay before sending result
    const sendDelay = Math.floor(Math.random() * 1500) + 500;
    await new Promise(resolve => setTimeout(resolve, sendDelay));

    api.sendMessage({
      body: pickRandom(resultMsgs),
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error fetching image: ${error.message}`, threadID, messageID);
  }
};
