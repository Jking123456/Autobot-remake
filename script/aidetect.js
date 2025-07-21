const axios = require("axios");

// In-memory cooldown tracker
const cooldowns = new Map();

module.exports.config = {
  name: "aidetect",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Detects whether the text is AI or human written.",
  commandCategory: "tools",
  usages: "aidetect [text]",
  cooldowns: 0, // Custom cooldown handled below
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const cooldownTime = 60 * 1000; // 1 minute in milliseconds
  const now = Date.now();

  if (cooldowns.has(senderID) && now - cooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - cooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft} seconds before using the "aidetect" command again.`, threadID, messageID);
  }

  // Set cooldown timestamp
  cooldowns.set(senderID, now);

  try {
    const text = args.join(" ");
    if (!text)
      return api.sendMessage("❗ Please provide some text to detect.\n\nUsage: aidetect [your text]", threadID, messageID);

    const res = await axios.get(`https://betadash-api-swordslush.vercel.app/aidetect?text=${encodeURIComponent(text)}`);
    const result = res.data;

    if (!result.success || !result.data) {
      return api.sendMessage("❌ API returned an invalid response.", threadID, messageID);
    }

    const {
      isHuman,
      aiWords,
      textWords,
      fakePercentage,
      feedback,
      additional_feedback
    } = result.data;

    const message = 
`🧠 AI Detection Result:

✅ Confidence it's Human: ${isHuman}%
🔠 Total Words: ${textWords}
🤖 AI Words Detected: ${aiWords}
⚠️ Fake Percentage: ${fakePercentage}%

💬 Feedback: ${feedback}
ℹ️ Note: ${additional_feedback}`;

    return api.sendMessage(message, threadID, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error occurred while fetching the detection result.", threadID, messageID);
  }
};
