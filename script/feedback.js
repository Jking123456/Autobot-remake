const userCooldowns = {}; // stores cooldown per user
const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes per user

module.exports.config = {
  name: "feedback",
  version: "1.2.0",
  role: 0,
  credits: "Homer Rebatis",
  description: "Send feedback to the bot admin (with per-user cooldown).",
  commandCategory: "utilities",
  cooldowns: 5,
  hasPrefix: true
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const adminID = "100044848836284";

  // ✅ Cooldown check
  if (userCooldowns[senderID]) {
    const remaining = COOLDOWN_DURATION - (Date.now() - userCooldowns[senderID]);
    if (remaining > 0) {
      const minutes = Math.floor(remaining / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      return api.sendMessage(
        `⏳ Please wait ${minutes}m ${seconds}s before sending feedback again.`,
        threadID,
        messageID
      );
    }
  }

  // Check if bot is admin in the group
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    if (!threadInfo.adminIDs.some(e => e.id === botID)) {
      return api.sendMessage(
        "🚫 This command can only be used in groups where the bot is an admin.",
        threadID,
        messageID
      );
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
    userCooldowns[senderID] = Date.now(); // ✅ Set cooldown for this user

    return api.sendMessage("✅ Your feedback has been sent to the bot admin.", threadID, messageID);
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to send feedback. Please try again later.", threadID, messageID);
  }
};
