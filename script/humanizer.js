const axios = require("axios");

module.exports.config = {
  name: "humanizer",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Humanizes the given input text using AI.",
  commandCategory: "tools",
  usages: "humanizer [text]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const text = args.join(" ");
    if (!text)
      return api.sendMessage("❗ Please provide some text to humanize.\n\nUsage: humanizer [your text]", event.threadID, event.messageID);

    const res = await axios.get(`https://betadash-api-swordslush.vercel.app/humanize?text=${encodeURIComponent(text)}`);
    const result = res.data;

    if (!result || result.error !== "No") {
      return api.sendMessage("❌ API returned an error or invalid response.", event.threadID, event.messageID);
    }

    const message = 
`📝 Humanized Text:

${result.message2 || result.message}

📌 Status: ${result.error === "No" ? "Success ✅" : "Failed ❌"}`;

    return api.sendMessage(message, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ An error occurred while fetching the humanized result.", event.threadID, event.messageID);
  }
};
