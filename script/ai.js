module.exports.config = {
  name: "ai",
  version: "1.2.6",
  permission: 0,
  credits: "Homer Rebatis",
  description: "Ask AI using Kaiz API (text-only).",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "ai <question>",
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID } = event;

  const API_ENDPOINT = "https://kaiz-apis.gleeze.com/api/kaiz-ai";
  const API_KEY = "25644cdb-f51e-43f1-894a-ec718918e649";
  const UID = Math.floor(Math.random() * 1000000).toString();

  try {
    const question = args.join(" ").trim();

    if (!question) {
      return api.sendMessage(
        "🧠 Homer AI Bot\n\n❌ Please enter a question to ask the AI.",
        threadID,
        messageID
      );
    }

    const queryParams = new URLSearchParams({
      ask: question,
      uid: UID,
      apikey: API_KEY
    });

    const fullUrl = `${API_ENDPOINT}?${queryParams.toString()}`;
    const res = await axios.get(fullUrl);
    const result = res?.data?.response;

    if (!result) {
      return api.sendMessage("⚠️ No response received from the AI API.", threadID, messageID);
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
