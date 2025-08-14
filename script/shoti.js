const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

const cooldowns = new Map();

module.exports.config = {
  name: "shoti",
  version: "1.0.1",
  role: 0,
  description: "Fetch a random Shoti video.",
  prefix: false,
  premium: false,
  credits: "Akimitsu (Modified by Homer Rebatis)",
  cooldowns: 10,
  category: "media"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;
  const now = Date.now();
  const cooldownTime = 200 * 1000;

  // Cooldown check
  if (cooldowns.has(senderID) && now < cooldowns.get(senderID)) {
    const remaining = ((cooldowns.get(senderID) - now) / 1000).toFixed(0);
    return api.sendMessage(`⏳ Please wait ${remaining} seconds before using the "shoti" command again.`, threadID, messageID);
  }
  cooldowns.set(senderID, now + cooldownTime);

  // Check if in group and bot is admin
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo.isGroup) {
      const botID = api.getCurrentUserID();
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("❌ Admin check failed:", err);
    return api.sendMessage("⚠️ Failed to check bot admin status. Please try again later.", threadID, messageID);
  }

  // Inform user
  api.sendMessage("🎬 Fetching a random Shoti video, please wait...", threadID, messageID);

  try {
    const res = await axios.get('https://kaiz-apis.gleeze.com/api/shoti?apikey=25644cdb-f51e-43f1-894a-ec718918e649');
    const data = res.data?.shoti;

    if (!data || !data.videoUrl) {
      return api.sendMessage('❌ Failed to fetch Shoti video. Try again later.', threadID, messageID);
    }

    const fileName = `${Date.now()}.mp4`;
    const filePath = path.join(__dirname, fileName);

    const videoStream = await axios({
      method: 'GET',
      url: data.videoUrl,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    videoStream.data.pipe(writer);

    writer.on('finish', () => {
      api.sendMessage({
        body: `🎥 Here’s your random Shoti video!\n\n📌 Title: ${data.title}\n👤 Username: @${data.username}\n🧑 Nickname: ${data.nickname}\n📍 Region: ${data.region}`,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);
    });

    writer.on('error', (err) => {
      console.error('❌ File write error:', err);
      api.sendMessage('🚫 Error saving the video. Please try again.', threadID, messageID);
    });

  } catch (error) {
    console.error('❌ API error:', error);
    api.sendMessage('🚫 Failed to fetch or send the Shoti video. Try again later.', threadID, messageID);
  }
};
