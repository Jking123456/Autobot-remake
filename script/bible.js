const axios = require('axios');

const cooldowns = new Map(); // Track user cooldowns

module.exports.config = {
  name: 'bible',
  version: '1.0.1',
  role: 0,
  hasPrefix: false,
  aliases: ['bible', 'verse'],
  description: "Get a random Bible verse",
  usage: "randombibleverse",
  credits: 'Homer Rebatis',
  cooldown: 3, // 3 seconds command trigger cooldown
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // ===== Check if bot is admin in a group =====
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 Bot must be admin to use this command in a group.",
          threadID, 
          messageID
        );
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage(
      "⚠️ Could not verify bot permissions. Try again later.",
      threadID,
      messageID
    );
  }

  // ===== Enforce cooldown per user =====
  const cooldownTime = 120 * 1000; // 2 minutes
  const now = Date.now();
  const lastUsed = cooldowns.get(senderID);

  if (lastUsed && now - lastUsed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
    return api.sendMessage(
      `⏳ Please wait ${timeLeft} seconds before using this command again.`,
      threadID,
      messageID
    );
  }
  cooldowns.set(senderID, now);

  api.sendMessage('🙏 Fetching a random Bible verse...', threadID, messageID);

  // ===== Fetch verse safely =====
  try {
    const response = await axios.get('https://ccprojectsapis.zetsu.xyz/api/randomverse', {
      timeout: 5000 // 5 seconds timeout to avoid hanging
    });

    const verseText = response.data?.text?.trim();
    const reference = response.data?.reference?.trim();

    if (!verseText || !reference) {
      throw new Error("API returned invalid data");
    }

    const message = `📖 Here is a random Bible verse:\n\n"${verseText}"\n\n— ${reference}`;
    await api.sendMessage(message, threadID, messageID);

  } catch (error) {
    console.error("Bible verse fetch error:", error.message || error);
    api.sendMessage(
      '❌ Could not fetch a Bible verse at this time. Please try again later.',
      threadID,
      messageID
    );
  }
};
