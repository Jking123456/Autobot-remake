const axios = require("axios");
const request = require("request");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "shoti",
  version: "1.0.0",
  credits: "Eugene Aguilar (Fixed by ChatGPT)",
  description: "Generate random TikTok girl videos",
  hasPermssion: 0,
  commandCategory: "other",
  usage: "[shoti]",
  cooldowns: 20,
  dependencies: [],
  usePrefix: true,
};

module.exports.handleEvent = async function ({ api, event }) {
  if (!(event.body?.toLowerCase().startsWith("shoti"))) return;

  try {
    api.setMessageReaction("🔄", event.messageID, () => {}, true);

    const response = await axios.get("https://haji-mix.up.railway.app/api/shoti");

    const videoData = response.data?.shoti;
    if (!videoData || !videoData.url) {
      return api.sendMessage("⚠️ Failed to fetch video.", event.threadID, event.messageID);
    }

    const videoPath = path.join(__dirname, "/cache/shoti.mp4");

    const file = fs.createWriteStream(videoPath);
    request(videoData.url).pipe(file);

    file.on("finish", async () => {
      api.setMessageReaction("🟢", event.messageID, () => {}, true);

      const username = videoData.username || "unknown";
      const nickname = videoData.nickname || "unknown";
      const title = videoData.title || "No title";

      await api.sendMessage(
        {
          body: `👤 Username: @${username}\n🏷️ Nickname: ${nickname}\n🎬 Title: ${title}`,
          attachment: fs.createReadStream(videoPath),
        },
        event.threadID,
        () => fs.unlinkSync(videoPath), // Clean up after sending
        event.messageID
      );
    });

    file.on("error", (err) => {
      fs.existsSync(videoPath) && fs.unlinkSync(videoPath);
      api.sendMessage(`❌ Shoti Error: ${err.message}`, event.threadID, event.messageID);
    });
  } catch (error) {
    api.setMessageReaction("🔴", event.messageID, () => {}, true);
    api.sendMessage(`⚠️ Unexpected error: ${error.message}`, event.threadID, event.messageID);
  }
};

module.exports.run = async function ({ api, event }) {
  api.sendMessage("⏳ Please wait..", event.threadID, event.messageID);
};
