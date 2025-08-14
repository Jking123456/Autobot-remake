const path = require("path");
const axios = require("axios");
const fs = require("fs");

const cooldowns = new Map(); // Cooldown tracker
const COOLDOWN_TIME = 5 * 60 * 60 * 1000; // 5 hours in ms

module.exports.config = {
  name: "video",
  version: "9.1",
  credits: "Homer Rebatis + Updated by ChatGPT", // API by Jonell & Churo
  description: "Search video from YouTube",
  commandCategory: "media",
  hasPermssion: 0,
  cooldowns: 9,
  usages: "[video [search]]",
  role: 0,
  hasPrefix: false,
};

module.exports.run = async function ({ api, args, event }) {
  const { threadID, messageID, senderID } = event;
  const now = Date.now();

  // ✅ Check 5-hour cooldown
  if (cooldowns.has(senderID)) {
    const lastUsed = cooldowns.get(senderID);
    const timePassed = now - lastUsed;

    if (timePassed < COOLDOWN_TIME) {
      const remaining = COOLDOWN_TIME - timePassed;
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(
        `⏳ Please wait ${hours}h ${minutes}m before using "video" again.`,
        threadID,
        messageID
      );
    }
  }
  cooldowns.set(senderID, now);

  // ✅ Admin check for group
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 Locked! To use this, make the bot admin in this group.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check error:", err);
    return api.sendMessage("⚠️ Could not verify bot's admin status. Please try again later.", threadID, messageID);
  }

  const searchQuery = args.join(" ");
  if (!searchQuery) {
    return api.sendMessage("📌 Usage: video <search text>", threadID, messageID);
  }

  try {
    const ugh = await api.sendMessage(`⏱️ | Searching for '${searchQuery}' please wait...`, threadID);
    api.setMessageReaction("🕥", messageID, () => {}, true);

    // Fetch data from API
    const response = await axios.get(`https://haji-mix.up.railway.app/api/youtube?search=${encodeURIComponent(searchQuery)}&stream=false&limit=1`);
    const videoData = response.data[0];

    if (!videoData || !videoData.play) {
      return api.sendMessage("❌ | No video found.", threadID, messageID);
    }

    const videoUrl = videoData.play;
    const title = videoData.title;
    const videoPath = path.join(__dirname, "cache", "video.mp4");

    // Download video
    const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(videoPath, Buffer.from(videoResponse.data));

    api.setMessageReaction("✅", messageID, () => {}, true);

    await api.sendMessage({
      body: `📹 Here's your video, enjoy!\n\n🎵 Title: ${title}`,
      attachment: fs.createReadStream(videoPath),
    }, threadID, () => fs.unlinkSync(videoPath), messageID);

    api.unsendMessage(ugh.messageID);

  } catch (error) {
    console.error("❌ Error:", error);
    api.sendMessage(`❌ | Error: ${error.message}`, threadID, messageID);
  }
};
