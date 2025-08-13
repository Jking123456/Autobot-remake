const axios = require("axios");

module.exports.config = {
  name: "fbdl",
  version: "1.4.0",
  permission: 0,
  description: "Download Facebook videos using fbdl <fb video url>",
};

module.exports.run = async ({ api, event, args, utils }) => {
  const { threadID, messageID } = event;

  if (!args || args.length === 0) {
    return api.sendMessage("❌ Usage: fbdl <Facebook video URL>", threadID, messageID);
  }

  const fbUrl = args[0];

  try {
    api.sendMessage("⏳ Downloading your Facebook video...", threadID, messageID);

    // Call the fbdl-v2 API
    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const response = await axios.get(`https://kaiz-apis.gleeze.com/api/fbdl-v2?url=${encodeURIComponent(fbUrl)}&apikey=${apiKey}`);
    const data = response.data;

    if (!data || !data.download_url) {
      return api.sendMessage("❌ Failed to fetch video. Make sure the URL is valid.", threadID, messageID);
    }

    const caption = `🎬 Author: ${data.author}`;

    // Send video as attachment
    api.sendMessage(
      {
        body: caption,
        attachment: await utils.getStreamFromURL(data.download_url)
      },
      threadID,
      messageID
    );

  } catch (err) {
    console.error(err);
    api.sendMessage("❌ Error occurred while downloading the video.", threadID, messageID);
  }
};
