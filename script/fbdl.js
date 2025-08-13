const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "fbdl",
  version: "1.4",
  author: "Homer Rebatis",
  cooldown: 5,
  description: "Download Facebook videos with optimized progress indicator",
  commandCategory: "media",
  usages: "[Facebook Video URL]",
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  try {
    if (!args[0]) return api.sendMessage("Please provide a Facebook video URL.", event.threadID);

    // Initial message
    const msg = await api.sendMessage("⏳ Downloading video: 0%", event.threadID);

    const url = encodeURIComponent(args[0]);
    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const apiURL = `https://kaiz-apis.gleeze.com/api/fbdl?url=${url}&apikey=${apiKey}`;

    const response = await axios.get(apiURL);
    const data = response.data;

    if (!data || !data.videoUrl) {
      return api.editMessage("❌ Failed to fetch video. Make sure the URL is correct.", msg.messageID);
    }

    const filePath = path.join(__dirname, `temp_video.mp4`);
    const writer = fs.createWriteStream(filePath);

    // Download video with progress
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
      // Update only if progress increased by at least 10%
      if (percent - lastPercent >= 10) {
        api.editMessage(`⏳ Downloading video: ${percent}%`, msg.messageID);
        lastPercent = percent;
      }
    });

    videoResponse.data.pipe(writer);

    writer.on('finish', async () => {
      await api.editMessage({
        body: `📹 Title: ${data.title}\n💡 Quality: ${data.quality}`,
        attachment: fs.createReadStream(filePath)
      }, msg.messageID);
      fs.unlinkSync(filePath); // delete temp file
    });

    writer.on('error', (err) => {
      console.error(err);
      api.editMessage("❌ Error downloading the video.", msg.messageID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("❌ An error occurred while fetching the video.", event.threadID);
  }
};
