module.exports.config = {
  name: "homer",
  version: "1.2.3",
  permission: 0,
  credits: "Homer Rebatis",
  description: "Ask Homer AI with or without image.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "homer <your question> | reply to image with ai",
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID, messageReply } = event;

  try {
    let ask = args.join(" ");
    let baseUrl = `https://apis-rho-nine.vercel.app/gemini`;

    if (!ask && !(messageReply?.attachments?.length)) {
      return api.sendMessage(
        "🧠 Homer AI Bot\n\n❌ Please provide a question or reply to an image.",
        threadID,
        messageID
      );
    }

    const query = {};

    if (ask) query.ask = ask;

    // Corrected key: imagurl
    if (messageReply && messageReply.attachments.length > 0) {
      const attachment = messageReply.attachments[0];
      if (attachment.type === "photo" && attachment.url) {
        query.imagurl = attachment.url;
      } else {
        return api.sendMessage("❌ Please reply to a valid photo.", threadID, messageID);
      }
    }

    const fullUrl = `${baseUrl}?${new URLSearchParams(query).toString()}`;

    const res = await axios.get(fullUrl);
    const description = res?.data?.description;

    if (!description) {
      return api.sendMessage("⚠️ No response received from Homer AI.", threadID, messageID);
    }

    return api.sendMessage(
      `•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃 |•\n\n${description}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ AI Error:", error?.response?.data || error.message || error);
    return api.sendMessage("❌ Error while processing your request. Please try again later.", threadID, messageID);
  }
};
