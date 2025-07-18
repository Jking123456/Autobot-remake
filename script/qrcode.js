const axios = require("axios");

module.exports.config = {
  name: "qrcode",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Generate a QR code from text.",
  commandCategory: "tools",
  usages: "qrcode [text]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const inputText = args.join(" ").trim();
  if (!inputText)
    return api.sendMessage("📌 Please enter the text to convert into a QR code.\n\nUsage: qrcode [text]", event.threadID, event.messageID);

  const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
  const apiUrl = `https://kaiz-apis.gleeze.com/api/qrcode-generator?text=${encodeURIComponent(inputText)}&apikey=${apiKey}`;

  try {
    const imageResponse = await axios.get(apiUrl, { responseType: "stream" });

    return api.sendMessage({
      body: `📲 Here's your QR code for:\n"${inputText}"`,
      attachment: imageResponse.data
    }, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to generate QR code. Please try again later.", event.threadID, event.messageID);
  }
};
