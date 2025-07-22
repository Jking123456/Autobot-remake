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
  const { threadID, messageID } = event;
  const inputText = args.join(" ").trim();

  // ✅ Check if bot is admin in group chat
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command can only be used if the bot is an admin in this group.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check error:", err);
    return api.sendMessage("⚠️ Failed to verify bot admin status. Try again later.", threadID, messageID);
  }

  if (!inputText)
    return api.sendMessage("📌 Please enter the text to convert into a QR code.\n\nUsage: qrcode [text]", threadID, messageID);

  const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
  const apiUrl = `https://kaiz-apis.gleeze.com/api/qrcode-generator?text=${encodeURIComponent(inputText)}&apikey=${apiKey}`;

  try {
    const imageResponse = await axios.get(apiUrl, { responseType: "stream" });

    return api.sendMessage({
      body: `📲 Here's your QR code for:\n"${inputText}"`,
      attachment: imageResponse.data
    }, threadID, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to generate QR code. Please try again later.", threadID, messageID);
  }
};
