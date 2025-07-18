const axios = require("axios");

module.exports.config = {
  name: "aidetect",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Detects whether the text is AI or human written.",
  commandCategory: "tools",
  usages: "aidetect [text]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const text = args.join(" ");
    if (!text)
      return api.sendMessage("❗ Please provide some text to detect.\n\nUsage: aidetect [your text]", event.threadID, event.messageID);

    const res = await axios.get(`https://betadash-api-swordslush.vercel.app/aidetect?text=${encodeURIComponent(text)}`);
    const result = res.data;

    if (!result.success || !result.data) {
      return api.sendMessage("❌ API returned an invalid response.", event.threadID, event.messageID);
    }

    const {
      isHuman,
      aiWords,
      textWords,
      fakePercentage,
      feedback,
      originalParagraph,
      additional_feedback
    } = result.data;

    const message = 
`🧠 AI Detection Result:

📄 Text: ${originalParagraph}
✅ Confidence it's Human: ${isHuman}%
🔠 Total Words: ${textWords}
🤖 AI Words Detected: ${aiWords}
⚠️ Fake Percentage: ${fakePercentage}%

💬 Feedback: ${feedback}
ℹ️ Note: ${additional_feedback}`;

    return api.sendMessage(message, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error occurred while fetching the detection result.", event.threadID, event.messageID);
  }
};
