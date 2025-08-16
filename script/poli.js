module.exports.config = {
  name: "poli",
  version: "1.0.2",
  role: 0,
  hasPrefix: true,
  credits: "Ulric dev + updated by ChatGPT",
  description: "Generate image from Pollinations API using new Kaiz endpoint.",
  usages: "poli [prompt]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  try {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    const time = new Date();
    const timestamp = time.toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(__dirname, "cache", `${timestamp}_tid.png`);

    if (!query) return api.sendMessage("❌ Please provide your prompt.", threadID, messageID);

    api.sendMessage(`🔎 Searching for "${query}"...`, threadID, messageID);

    // Step 1: Request image link from API
    const response = await axios.get(
      `https://kaiz-apis.gleeze.com/api/poli?prompt=${encodeURIComponent(query)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`
    );

    // Ensure response has a valid URL
    let imageUrl = null;
    if (response.data?.url && response.data.url.startsWith("http")) {
      imageUrl = response.data.url;
    } else if (typeof response.data === "string" && response.data.startsWith("http")) {
      imageUrl = response.data;
    }

    if (!imageUrl) {
      return api.sendMessage("❌ API did not return a valid image URL.", threadID, messageID);
    }

    // Step 2: Download image
    const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(filePath, imageBuffer, "binary");

    // Step 3: Send to Messenger
    setTimeout(() => {
      api.sendMessage(
        {
          body: "✅ Download Successfully!",
          attachment: fs.createReadStream(filePath),
        },
        threadID,
        () => fs.unlinkSync(filePath)
      );
    }, 2000);
  } catch (error) {
    api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
  }
};
