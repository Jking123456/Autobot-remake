const axios = require('axios');

module.exports.config = {
  name: "insult",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  description: "Get a random insult.",
  usage: "insult",
  credits: "Developer",
  cooldown: 0
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;

  try {
    // ✅ Restrict use if bot is not admin in group chat
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs.some(e => e.id == botID);

    if (!isBotAdmin) {
      return api.sendMessage("🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.", threadID, messageID);
    }

    const response = await axios.get('https://evilinsult.com/generate_insult.php?lang=fr&type=json');
    const insult = response.data.insult;

    return api.sendMessage(`🖕: ${insult}`, threadID, messageID);

  } catch (error) {
    console.error("Insult API Error:", error);
    return api.sendMessage("❌ Sorry, I couldn't fetch an insult right now. Try again later.", threadID, messageID);
  }
};
