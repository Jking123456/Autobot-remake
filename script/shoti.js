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

    const response = await axios.get("https://betadash-shoti-yazky.vercel.app/shotizxx?apikey=shipazu");

    let videoUrl, username = "unknown", nickname = "unknown", title = "No title";

    if (response.data.error && response.data.catch_url) {
      videoUrl = response.data.catch_url;
      title = "Fallback video due to original error.";
    } else if (response.data.shoti && response.data.shoti.url) {
      const videoData = response.data.shoti;
      videoUrl = videoData.url;
      username = videoData.username || "unknown";
      nickname = videoData.nickname || "unknown";
      title = videoData.title || "No title";
    } else {
      return api.sendMessage("⚠️ Failed to fetch video.", event.threadID, event.messageID);
    }

    const videoPath = path.join(__dirname, "/cache/shoti.mp4");
    const file = fs.createWriteStream(videoPath);

    request(videoUrl).pipe(file);

    file.on("finish", async () => {
      api.setMessageReaction("🟢", event.messageID, () => {}, true);

      await api.sendMessage(
        {
          body: `👤 Username: @${username}\n🏷️ Nickname: ${nickname}\n🎬 Title: ${title}`,
          attachment: fs.createReadStream(videoPath),
        },
        event.threadID,
        () => fs.unlinkSync(videoPath),
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
