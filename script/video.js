const path = require("path");
const axios = require("axios");
const fs = require("fs");

module.exports.config = {
  name: "video",
  version: "9",
  credits: "Cliff", // api by jonell & churo
  description: "Search video from YouTube",
  commandCategory: "media",
  hasPermssion: 0,
  cooldowns: 9,
  usages: "[video [search]",
  role: 0,
  hasPrefix: false,
};

module.exports.run = async function ({ api, args, event }) {
  try {
    const searchQuery = args.join(" ");
    if (!searchQuery) {
      api.sendMessage("Usage: video <search text>", event.threadID);
      return;
    }

    const ugh = await api.sendMessage(`⏱️ | Searching for '${searchQuery}' please wait...`, event.threadID);

    api.setMessageReaction("🕥", event.messageID, (err) => {}, true);

    // Fetch data from API
    const response = await axios.get(`https://haji-mix.up.railway.app/api/youtube?search=${encodeURIComponent(searchQuery)}&stream=false&limit=1`);

    // Extract the first result from the array
    const videoData = response.data[0];

    if (!videoData || !videoData.play) {
      api.sendMessage("❌ | No video found.", event.threadID, event.messageID);
      return;
    }

    const videoUrl = videoData.play;
    const title = videoData.title;
    const thumbnail = videoData.thumbnail;

    const videoPath = path.join(__dirname, "cache", "video.mp4");

    // Download video
    const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(videoPath, Buffer.from(videoResponse.data));

    api.setMessageReaction("✅", event.messageID, (err) => {}, true);

    await api.sendMessage(
      {
        body: `Here's your video, enjoy! 🥰\n\n𝗧𝗶𝘁𝗹𝗲: ${title}`,
        attachment: fs.createReadStream(videoPath),
      },
      event.threadID,
      event.messageID
    );

    fs.unlinkSync(videoPath); // Delete temp file
    api.unsendMessage(ugh.messageID);

  } catch (error) {
    api.sendMessage(`❌ | Error: ${error.message}`, event.threadID, event.messageID);
    console.error(error);
  }
};
