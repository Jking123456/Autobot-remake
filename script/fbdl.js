const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "fbdl",
  version: "1.0",
  author: "Homer Rebatis",
  cooldown: 5,
  description: "Download Facebook videos and send directly",
  commandCategory: "media",
  usages: "[Facebook Video URL]",
  dependencies: {}
};

module.exports.run = async function({ api, event, args }) {
  try {
    if (!args[0]) return api.sendMessage("Please provide a Facebook video URL.", event.threadID);

    const url = encodeURIComponent(args[0]);
    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const apiURL = `https://kaiz-apis.gleeze.com/api/fbdl?url=${url}&apikey=${apiKey}`;

    const response = await axios.get(apiURL);
    const data = response.data;

    if (!data || !data.videoUrl) {
      return api.sendMessage("Failed to fetch video. Make sure the URL is correct.", event.threadID);
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
      api.sendMessage({
        body: `📹 Title: ${data.title}\n💡 Quality: ${data.quality}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        fs.unlinkSync(filePath); // delete temp video after sending
      });
    });

    writer.on('error', (err) => {
      console.error(err);
      api.sendMessage("Error downloading the video.", event.threadID);
    });

  } catch (error) {
    console.error(error);
    api.sendMessage("An error occurred while fetching the video.", event.threadID);
  }
};
