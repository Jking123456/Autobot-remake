const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const request = require('request');

module.exports.config = {
  name: "music",
  version: "1.0.1",
  role: 0,
  hasPrefix: true,
  aliases: ['play'],
  usage: 'music [song name]',
  description: 'Search and download music from Spotify using API',
  credits: 'Ulric dev (Fixed by ChatGPT)',
  cooldown: 5
};

module.exports.run = async function ({ api, event, args }) {
  const query = args.join(' ');
  if (!query) {
    return api.sendMessage(`Please enter a song name.\nExample: music Shape of You`, event.threadID, event.messageID);
  }

  try {
    api.sendMessage(`🔎 Searching for "${query}"...`, event.threadID, event.messageID);

    const apiUrl = `https://betadash-search-download.vercel.app/spt?search=${encodeURIComponent(query)}`;
    const res = await axios.get(apiUrl);
    const data = res.data;

    if (!data || !data.download_url) {
      return api.sendMessage("❌ Could not find the song or download link is missing.", event.threadID, event.messageID);
    }

    const title = data.title || "Unknown Title";
    const artist = data.artists || "Unknown Artist";
    const thumbnail = data.thumbnail || null;
    const downloadUrl = data.download_url;

    const fileName = `${Date.now()}_music.mp3`;
    const filePath = path.join(__dirname, 'cache', fileName);

    const file = fs.createWriteStream(filePath);
    request(downloadUrl)
      .pipe(file)
      .on("finish", () => {
        const stats = fs.statSync(filePath);
        if (stats.size > 25 * 1024 * 1024) {
          fs.unlinkSync(filePath);
          return api.sendMessage("⚠️ The file is larger than 25MB and cannot be sent.", event.threadID);
        }

        const msg = {
          body: `🎵 Title: ${title}\n🎤 Artist: ${artist}`,
          attachment: fs.createReadStream(filePath)
        };

        api.sendMessage(msg, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      })
      .on("error", err => {
        console.error(err);
        fs.existsSync(filePath) && fs.unlinkSync(filePath);
        api.sendMessage("❌ Failed to download the song.", event.threadID, event.messageID);
      });

  } catch (err) {
    console.error(err);
    api.sendMessage("⚠️ An unexpected error occurred while processing your request.", event.threadID, event.messageID);
  }
};
