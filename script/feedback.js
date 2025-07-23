module.exports.config = {
  name: "feedback",
  version: "1.1.0",
  role: 0,
  credits: "pakyubot + ChatGPT",
  description: "Send feedback to the bot admin (only if bot is admin in group).",
  commandCategory: "utilities",
  cooldowns: 5,
  hasPrefix: true
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const adminID = "100044848836284";

  // Check if bot is admin in group
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (!threadInfo.adminIDs.some(e => e.id === botID)) {
      return api.sendMessage("🚫 This command can only be used in groups where the bot is an admin.", threadID, messageID);
    }
  } catch (e) {
    console.error("Error checking bot admin status:", e);
    return api.sendMessage("❌ Unable to verify bot admin status. Please try again.", threadID, messageID);
  }

  const feedback = args.join(" ");
  if (!feedback) {
    return api.sendMessage("❌ Please provide a message to send as feedback.", threadID, messageID);
  }

  try {
    const userInfo = await api.getUserInfo(senderID);
    const senderName = userInfo[senderID]?.name || "Unknown User";

    const msg = `📩 New Feedback Received:\n\n` +
                `👤 Sender Name: ${senderName}\n` +
                `🆔 Sender ID: ${senderID}\n` +
                `💬 Message: ${feedback}\n\n` +
                `🧵 From Thread ID: ${threadID}`;

    await api.sendMessage(msg, adminID);
    return api.sendMessage("✅ Your feedback has been sent to the bot admin.", threadID, messageID);
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to send feedback. Please try again later.", threadID, messageID);
  }
};
