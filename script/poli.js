module.exports.config = {
  name: "poli",
  version: "1.0.1",
  role: 0,
  hasPrefix: true,
  credits: "Ulric dev + updated by ChatGPT",
  description: "Generate image from Pollinations API using new Kaiz endpoint.",
  usages: "poli [prompt]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const axios = require('axios');
  const fs = require('fs-extra');

  try {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    const time = new Date();
    const timestamp = time.toISOString().replace(/[:.]/g, "-");
    const path = __dirname + '/cache/' + `${timestamp}_tid.png`;

    if (!query) return api.sendMessage("Please provide your prompt.", threadID, messageID);

    api.sendMessage(`Searching for "${query}"...`, threadID, messageID);

    // Step 1: Get the image link from API
    const response = await axios.get(`https://kaiz-apis.gleeze.com/api/poli?prompt=${encodeURIComponent(query)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`);
    const imageUrl = response.data.url || response.data; // Adjust if API returns plain URL

    // Step 2: Download the image
    const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(path, Buffer.from(imageBuffer, "utf-8"));

    // Step 3: Send to Messenger
    setTimeout(function () {
      api.sendMessage({
        body: "Download Successfully!",
        attachment: fs.createReadStream(path)
      }, threadID, () => fs.unlinkSync(path));
    }, 2000);

  } catch (error) {
    api.sendMessage(`Error: ${error.message}`, event.threadID, event.messageID);
  }
};
