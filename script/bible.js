const axios = require('axios');

const cooldowns = new Map(); // Cooldown tracker

module.exports.config = {
  name: 'bible',
  version: '1.0.0',
  role: 0,
  hasPrefix: false,
  aliases: ['bible', 'verse'],
  description: "Get a random Bible verse",
  usage: "randombibleverse",
  credits: 'chilling',
  cooldown: 3,
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  const cooldownTime = 60 * 1000; // 1 minute
  const now = Date.now();
  const lastUsed = cooldowns.get(senderID);

  if (lastUsed && now - lastUsed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before using "bible" again.`, threadID, messageID);
  }

  cooldowns.set(senderID, now); // Start cooldown

  api.sendMessage('🙏 Fetching a random Bible verse, please wait...', threadID, messageID);

  try {
    const response = await axios.get('https://ccprojectsapis.zetsu.xyz/api/randomverse');

    const verseText = response.data.text?.trim();
    const reference = response.data.reference;

    if (!verseText || !reference) {
      throw new Error("Invalid response structure.");
    }

    const message = `📖 Here is a random Bible verse for you:\n\n"${verseText}"\n\n— ${reference}`;
    
    api.sendMessage(message, threadID, messageID);
  } catch (error) {
    console.error("Bible verse fetch error:", error.message || error);
    api.sendMessage('❌ An error occurred while fetching the Bible verse. Please try again later.', threadID, messageID);
  }
};
