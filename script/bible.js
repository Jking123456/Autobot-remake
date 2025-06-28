const axios = require('axios');

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
  api.sendMessage('🙏 Fetching a random Bible verse, please wait...', event.threadID, event.messageID);

  try {
    const response = await axios.get('https://ccprojectsapis.zetsu.xyz/api/randomverse');

    const verseText = response.data.text?.trim();
    const reference = response.data.reference;

    if (!verseText || !reference) {
      throw new Error("Invalid response structure.");
    }

    const message = `📖 Here is a random Bible verse for you:\n\n"${verseText}"\n\n— ${reference}`;
    
    api.sendMessage(message, event.threadID, event.messageID);
  } catch (error) {
    console.error("Bible verse fetch error:", error.message || error);
    api.sendMessage('❌ An error occurred while fetching the Bible verse. Please try again later.', event.threadID, event.messageID);
  }
};
