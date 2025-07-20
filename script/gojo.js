const axios = require("axios");

module.exports.config = {
  name: "gojo",
  version: "1.0.0",
  permission: 0,
  credits: "Homer Rebatis",
  description: "Ask AI (Gojo)",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "gojo <your question>",
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const question = args.join(" ").trim();
  const uid = Math.floor(Math.random() * 1000000).toString();
  const apikey = "25644cdb-f51e-43f1-894a-ec718918e649";

  if (!question) {
    return api.sendMessage("💬 Please enter a question. Example: gojo who's the best sorcerer?", threadID, messageID);
  }

  try {
    const url = `https://kaiz-apis.gleeze.com/api/gojo?ask=${encodeURIComponent(question)}&uid=${uid}&apikey=${apikey}`;
    const res = await axios.get(url);

    const reply = res?.data?.response;

    if (!reply) {
      return api.sendMessage("⚠️ No response received from the Gojo API.", threadID, messageID);
    }

    return api.sendMessage(
      `•| 𝙶𝙾𝙹𝙾 𝚂𝙰𝚃𝙾𝚁𝚄 |•\n\n${reply}\n\n•| 𝙼𝙰𝙳𝙴 𝙱𝚈 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂  |•`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ Gojo API Error:", error?.response?.data || error.message || error);
    return api.sendMessage("❌ An error occurred while contacting the Gojo AI. Please try again later.", threadID, messageID);
  }
};
