const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "fbdl",
  version: "1.7",
  author: "Homer Rebatis",
  cooldown: 5,
  description: "Download Facebook videos with progress indicator and auto-delete message",
  commandCategory: "media",
  usages: "[Facebook Video URL]",
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  try {
    if (!args[0]) return api.sendMessage("Please provide a Facebook video URL.", event.threadID);

    // Send initial downloading message
    let downloadingMsg = await api.sendMessage("⏳ Downloading video: 0%", event.threadID);

    const url = encodeURIComponent(args[0]);
    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const apiURL = `https://kaiz-apis.gleeze.com/api/fbdl?url=${url}&apikey=${apiKey}`;

    const response = await axios.get(apiURL);
    const data = response.data;

    if (!data || !data.videoUrl) {
      return api.sendMessage("❌ Failed to fetch video. Make sure the URL is correct.", event.threadID);
    }

    // Download video using stream with progress
    const filePath = path.join(__dirname, `temp_video.mp4`);
    const writer = fs.createWriteStream(filePath);

    const videoResponse = await axios({
      url: data.videoUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const totalLength = videoResponse.headers['content-length'];
    let downloaded = 0;
    let lastPercent = 0;

    videoResponse.data.on('data', chunk => {
      downloaded += chunk.length;
      const percent = Math.floor((downloaded / totalLength) * 100);
      if (percent - lastPercent >= 10) { // update every 10%
        api.editMessage(`⏳ Downloading video: ${percent}%`, downloadingMsg.messageID);
        lastPercent = percent;
      }
    });

    videoResponse.data.pipe(writer);

    writer.on('finish', async () => {
      // Send the video in a separate message
      await api.sendMessage({
        body: `📹 Title: ${data.title}\n💡 Quality: ${data.quality}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID);

      // Delete temp file
      fs.unlinkSync(filePath);

      // Delete downloading message
      api.deleteMessage(downloadingMsg.messageID, event.threadID);
    });

    writer.on('error', (err) => {
      console.error(err);
      api.sendMessage("❌ Error downloading the video.", event.threadID);
      // Delete downloading message on error
      api.deleteMessage(downloadingMsg.messageID, event.threadID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ An error occurred while fetching the video.", event.threadID);
  }
};
