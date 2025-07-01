const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Cooldown tracker (user ID => timestamp)
const cooldownMap = new Map();

module.exports.config = {
  name: "redroom",
  version: "1.0.2",
  cooldown: 60,
  role: 0,
  hasPrefix: true,
  aliases: ['porno'],
  description: "Sends a random 18+ video from the API",
  usage: "{prefix}redroom",
  credits: "Hazeyy, updated by ChatGPT"
};

module.exports.run = async function({ api, event }) {
  const userId = event.senderID;
  const now = Date.now();
  const cooldownTime = 20 * 60 * 1000; // 20 minutes in milliseconds

  if (cooldownMap.has(userId)) {
    const lastUsed = cooldownMap.get(userId);
    const remaining = cooldownTime - (now - lastUsed);
    if (remaining > 0) {
      const minutes = Math.ceil(remaining / 60000);
      return api.sendMessage(`⏳ Please wait ${minutes} more minute(s) before using this command again.`, event.threadID, event.messageID);
    }
  }

  cooldownMap.set(userId, now);

  try {
    api.sendMessage("📀 | Sending video, please wait...", event.threadID, event.messageID);

    const response = await axios.get("https://kaiz-apis.gleeze.com/api/youjizz?limit=1&apikey=12417c89-ac72-4c8e-a174-9ee378771b24");

    const video = response.data?.videos?.[0];
    if (!video || !video.videoUrl) {
      return api.sendMessage("⚠️ No video found or API returned invalid data.", event.threadID, event.messageID);
    }

    const { title = "Untitled", duration = "Unknown", views = 0, rating = 0, videoUrl } = video;

    const videoBuffer = await axios.get(videoUrl, { responseType: "arraybuffer" });
    const fileName = `${Date.now()}.mp4`;
    const filePath = path.join(__dirname, "cache", fileName);
    fs.writeFileSync(filePath, Buffer.from(videoBuffer.data, 'binary'));

    const message = {
      body: `🎬 Title: ${title}\n⏱ Duration: ${duration}\n👁 Views: ${views}\n⭐ Rating: ${rating}`,
      attachment: fs.createReadStream(filePath)
    };

    api.sendMessage(message, event.threadID, () => {
      fs.unlinkSync(filePath); // Clean up video file after sending
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
    api.sendMessage("❌ Error sending video. Please try again later.", event.threadID, event.messageID);
  }
};
