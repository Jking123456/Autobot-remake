module.exports.config = {
  name: "feedback",
  version: "1.0.0",
  role: 0, // anyone can use
  credits: "pakyubot + ChatGPT",
  description: "Send feedback to the bot admin",
  commandCategory: "utilities",
  cooldowns: 5,
  hasPrefix: true
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const adminID = "100044848836284";
  const feedback = args.join(" ");

  if (!feedback) {
    return api.sendMessage("❌ Please provide a message to send as feedback.", threadID, messageID);
  }

  try {
    const userName = await api.getUserInfo(senderID);
    const senderName = userName[senderID]?.name || "Unknown User";

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
