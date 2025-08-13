const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "fbdl",
  version: "1.1",
  author: "Homer Rebatis",
  cooldown: 5,
  description: "Download Facebook videos and send directly with status",
  commandCategory: "media",
  usages: "[Facebook Video URL]",
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  try {
    if (!args[0]) return api.sendMessage("Please provide a Facebook video URL.", event.threadID);

    // Send initial downloading message
    const msg = await api.sendMessage("⏳ Downloading video, please wait...", event.threadID);

    const url = encodeURIComponent(args[0]);
    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const apiURL = `https://kaiz-apis.gleeze.com/api/fbdl?url=${url}&apikey=${apiKey}`;

    const response = await axios.get(apiURL);
    const data = response.data;

    if (!data || !data.videoUrl) {
      return api.editMessage("❌ Failed to fetch video. Make sure the URL is correct.", msg.messageID);
    }

    // Download video to temp folder
    const videoResponse = await axios({
      url: data.videoUrl,
      method: 'GET',
      responseType: 'stream'
    });

    const filePath = path.join(__dirname, `temp_video.mp4`);
    const writer = fs.createWriteStream(filePath);
    videoResponse.data.pipe(writer);

    writer.on('finish', () => {
      api.editMessage({
        body: `📹 Title: ${data.title}\n💡 Quality: ${data.quality}`,
        attachment: fs.createReadStream(filePath)
      }, msg.messageID, () => {
        fs.unlinkSync(filePath); // delete temp video after sending
      });
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
