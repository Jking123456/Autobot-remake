const axios = require("axios");
const puppeteer = require("puppeteer");

module.exports.config = {
  name: "fbdl",
  version: "1.3.0",
  permission: 0,
  description: "Download Facebook videos using command fbdl <fb video url>",
};

module.exports.run = async ({ api, event, args, utils }) => {
  const { threadID, messageID } = event;

  if (!args || args.length === 0) {
    return api.sendMessage("❌ Usage: fbdl <Facebook video URL>", threadID, messageID);
  }

  const fbUrl = args[0];

  try {
    api.sendMessage("⏳ Resolving Facebook video URL...", threadID, messageID);

    // Launch Puppeteer to follow redirects and get final URL
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(fbUrl, { waitUntil: "networkidle2" });
    const finalUrl = page.url(); // final resolved URL
    await browser.close();

    api.sendMessage("⏳ Downloading video via API...", threadID, messageID);

    // Call fbdl-v2 API
    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const response = await axios.get(`https://kaiz-apis.gleeze.com/api/fbdl-v2?url=${encodeURIComponent(finalUrl)}&apikey=${apiKey}`);
    const data = response.data;

    if (!data || !data.download_url) {
      return api.sendMessage("❌ Failed to fetch video. Make sure the link is a valid Facebook video.", threadID, messageID);
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
