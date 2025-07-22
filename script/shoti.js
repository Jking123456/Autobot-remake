const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

const cooldowns = new Map(); // Cooldown tracker

module.exports.config = {
  name: "shoti",
  version: "1.0.0",
  role: 0,
  description: "Fetch a random Shoti video.",
  prefix: false,
  premium: false,
  credits: "Akimitsu (Modified by ChatGPT)",
  cooldowns: 10,
  category: "media"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const now = Date.now();
  const cooldownTime = 60 * 1000; // 1 minute

  // Check if the bot is an admin in group chats
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command is disabled in this group because the bot is not an admin.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Unable to verify bot admin status. Try again later.", threadID, messageID);
  }

  // Cooldown check
  if (cooldowns.has(senderID)) {
    const expiration = cooldowns.get(senderID);
    if (now < expiration) {
      const remaining = ((expiration - now) / 1000).toFixed(0);
      return api.sendMessage(`⏳ Please wait ${remaining} seconds before using the "shoti" command again.`, threadID, messageID);
    }
  }

  cooldowns.set(senderID, now + cooldownTime);

  try {
    api.sendMessage("🎬 Fetching a random Shoti video, please wait...", threadID, messageID);

    const response = await axios.get('https://kaiz-apis.gleeze.com/api/shoti?apikey=25644cdb-f51e-43f1-894a-ec718918e649');
    const data = response.data?.shoti;

    if (!data || !data.videoUrl) {
      return api.sendMessage('❌ Failed to fetch a Shoti video. Please try again later.', threadID, messageID);
    }

    const fileName = `${messageID}.mp4`;
    const filePath = path.join(__dirname, fileName);

    const downloadResponse = await axios({
      method: 'GET',
      url: data.videoUrl,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(filePath);
    downloadResponse.data.pipe(writer);

    writer.on('finish', async () => {
      api.sendMessage({
        body: `🎥 Here’s your random Shoti video!\n\n📌 Title: ${data.title}\n👤 User: @${data.username}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        fs.unlinkSync(filePath); // Clean up
      }, messageID);
    });

    writer.on('error', () => {
      api.sendMessage('🚫 Error downloading the video. Please try again.', threadID, messageID);
    });

  } catch (error) {
    console.error('Error fetching Shoti video:', error);
    api.sendMessage('🚫 Error fetching Shoti video. Try again later.', threadID, messageID);
  }
};
