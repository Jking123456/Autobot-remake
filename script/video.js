const path = require("path");
const axios = require("axios");
const fs = require("fs");

const cooldowns = new Map(); // Cooldown tracker

module.exports.config = {
  name: "video",
  version: "9",
  credits: "Homer Rebatis", // API by Jonell & Churo
  description: "Search video from YouTube",
  commandCategory: "media",
  hasPermssion: 0,
  cooldowns: 9,
  usages: "[video [search]",
  role: 0,
  hasPrefix: false,
};

module.exports.run = async function ({ api, args, event }) {
  const { threadID, messageID, senderID } = event;

  // ✅ Admin check for group
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command can only be used in groups where the bot is an admin.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check error:", err);
    return api.sendMessage("⚠️ Could not verify bot's admin status. Please try again later.", threadID, messageID);
  }

  // Cooldown check
  const cooldownTime = 30 * 1000; // 1 minute in milliseconds
  const now = Date.now();
  const lastUsed = cooldowns.get(senderID);

  if (lastUsed && now - lastUsed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before using "video" again.`, threadID, messageID);
  }

  const searchQuery = args.join(" ");
  if (!searchQuery) {
    return api.sendMessage("📌 Usage: video <search text>", threadID, messageID);
  }

  try {
    cooldowns.set(senderID, now); // Set cooldown

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
