module.exports.config = {
  name: "ai",
  version: "1.2.7",
  permission: 0,
  credits: "Homer Rebatis + ChatGPT",
  description: "Ask AI via Kaiz Gemini Vision (image) or Kaiz-AI (text only).",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "ai <question> | reply to image",
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID, messageReply } = event;

  const TEXT_API = "https://kaiz-apis.gleeze.com/api/kaiz-ai";
  const IMAGE_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
  const TEXT_API_KEY = "25644cdb-f51e-43f1-894a-ec718918e649";
  const IMAGE_API_KEY = "12417c89-ac72-4c8e-a174-9ee378771b24";
  const UID = Math.floor(Math.random() * 1000000).toString();

  try {
    const question = args.join(" ").trim();
    let imageUrl = null;

    // Check if replying to an image
    if (messageReply && messageReply.attachments.length > 0) {
      const attachment = messageReply.attachments[0];
      if (attachment.type === "photo" && attachment.url) {
        imageUrl = attachment.url;
      } else {
        return api.sendMessage("❌ Please reply to a valid photo.", threadID, messageID);
      }
    }

    // Image AI Request
    if (imageUrl) {
      const imageParams = new URLSearchParams({
        q: question || "What’s in this image?",
        uid: UID,
        imageUrl: imageUrl,
        apikey: IMAGE_API_KEY
      });

      const fullUrl = `${IMAGE_API}?${imageParams.toString()}`;
      const res = await axios.get(fullUrl);
      const result = res?.data?.response;

      if (!result) {
        return api.sendMessage("⚠️ No response received from the image AI API.", threadID, messageID);
      }

      return api.sendMessage(
        `•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃 (𝙸𝙼𝙰𝙶𝙴) |•\n\n${result}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`,
        threadID,
        messageID
      );
    }

    // Text-only AI Request
    if (!question) {
      return api.sendMessage("🧠 Please enter a question or reply to an image.", threadID, messageID);
    }

    const textParams = new URLSearchParams({
      ask: question,
      uid: UID,
      apikey: TEXT_API_KEY
    });

    const fullUrl = `${TEXT_API}?${textParams.toString()}`;
    const res = await axios.get(fullUrl);
    const result = res?.data?.response;

    if (!result) {
      return api.sendMessage("⚠️ No response received from the text AI API.", threadID, messageID);
    }

    return api.sendMessage(
      `•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃 |•\n\n${result}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ AI Error:", error?.response?.data || error.message || error);
    return api.sendMessage("❌ An error occurred while processing your request. Please try again later.", threadID, messageID);
  }
};
