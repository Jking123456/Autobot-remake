const axios = require("axios");

module.exports.config = {
  name: "freesms",
  version: "1.0.4",
  role: 0,
  hasPrefix: true,
  credits: "Homer Rebatis",
  description: "Send free SMS using urangkapolka API",
  usages: "[number] [message]",
  cooldown: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // 🚫 Restrict command if bot is not an admin in the thread
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs.some(e => e.id === botID);

    if (!isBotAdmin) {
      return api.sendMessage("❌ This command only works if the bot is an **admin** in this chat.", threadID, messageID);
    }
  } catch (err) {
    console.error("Error checking admin status:", err);
    return api.sendMessage("❌ Unable to verify admin status. Please try again later.", threadID, messageID);
  }

  const number = args[0];
  const message = args.slice(1).join(" ");

  if (!number || !message) {
    return api.sendMessage("❌ Usage:\n`freesms <number> <message>`", threadID, messageID);
  }

  try {
    const res = await axios.get("https://urangkapolka.vercel.app/api/sms", {
      params: {
        number,
        message
      }
    });

    const result = res.data;

    if (result.status === 200 && result.data?.success >= 1) {
      return api.sendMessage(
        `✅ SMS sent to ${number}!\n📩 ${result.data.message || "Message delivered."}`,
        threadID,
        messageID
      );
    } else {
      return api.sendMessage(
        `❌ Failed to send SMS.\n📭 ${result.data?.subject || "Unknown error"}\n📝 ${result.data?.message || ""}`,
        threadID,
        messageID
      );
    }

  } catch (err) {
    console.error("❌ SMS Error:", err);
    return api.sendMessage(`❌ Error occurred while sending SMS:\n${err.message}`, threadID, messageID);
  }
};
