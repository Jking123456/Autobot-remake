module.exports.config = {
  name: "ai",
  version: "1.2.0",
  permission: 0,
  credits: "Homer Rebatis",
  description: "Ask Homer AI with or without image.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "ai <your question> | reply to image with ai",
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID, senderID, messageReply } = event;

  try {
    let ask = args.join(" ");
    if (!ask && !(messageReply && messageReply.attachments?.length)) {
      return api.sendMessage("🧠 Homer AI Bot\n━━━━━━━━━━━\n\n❌ Please provide a question or reply to an image.", threadID, messageID);
    }

    let apiUrl = `https://apis-rho-nine.vercel.app/gemini?ask=${encodeURIComponent(ask)}`;

    if (messageReply && messageReply.attachments.length > 0) {
      const attachment = messageReply.attachments[0];
      if (attachment.type === "photo") {
        const imageUrl = attachment.url;
        apiUrl += `&imageUrl=${encodeURIComponent(imageUrl)}`;
      }
    }

    const res = await axios.get(apiUrl);
    const description = res?.data?.data?.description;

    if (!description) {
      return api.sendMessage("⚠️ No response received from Homer AI.", threadID, messageID);
    }

    return api.sendMessage(
      `•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃 |•\n\n${description}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ AI Error:", error.message || error);
    return api.sendMessage("❌ An unexpected error occurred while processing your request.", threadID, messageID);
  }
};
