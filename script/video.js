const path = require("path");
const axios = require("axios");
const fs = require("fs");

const cooldowns = new Map(); // Cooldown tracker

module.exports.config = {
  name: "video",
  version: "9",
  credits: "Cliff", // API by Jonell & Churo
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

  // Check cooldown
  const cooldownTime = 60 * 3000; // 1 minute in milliseconds
  const now = Date.now();
  const lastUsed = cooldowns.get(senderID);

  if (lastUsed && now - lastUsed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before using "video" again.`, threadID, messageID);
  }

  const searchQuery = args.join(" ");
  if (!searchQuery) {
    api.sendMessage("Usage: video <search text>", threadID, messageID);
    return;
  }

  try {
    cooldowns.set(senderID, now); // Set cooldown

    const ugh = await api.sendMessage(`⏱️ | Searching for '${searchQuery}' please wait...`, threadID);
    api.setMessageReaction("🕥", messageID, () => {}, true);

    // Fetch data from API
    const response = await axios.get(`https://haji-mix.up.railway.app/api/youtube?search=${encodeURIComponent(searchQuery)}&stream=false&limit=1`);

    const videoData = response.data[0];

    if (!videoData || !videoData.play) {
      api.sendMessage("❌ | No video found.", threadID, messageID);
      return;
    }

    const videoUrl = videoData.play;
    const title = videoData.title;
    const videoPath = path.join(__dirname, "cache", "video.mp4");

    // Download video
    const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(videoPath, Buffer.from(videoResponse.data));

    api.setMessageReaction("✅", messageID, () => {}, true);

    await api.sendMessage(
      {
        body: `Here's your video, enjoy! 🥰\n\n𝗧𝗶𝘁𝗹𝗲: ${title}`,
        attachment: fs.createReadStream(videoPath),
      },
      threadID,
      messageID
    );

    fs.unlinkSync(videoPath); // Delete temp file
    api.unsendMessage(ugh.messageID);

  } catch (error) {
    api.sendMessage(`❌ | Error: ${error.message}`, threadID, messageID);
    console.error(error);
  }
};
