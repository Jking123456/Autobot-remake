module.exports.config = {
  name: "botadmin",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: "Block all commands in group if bot is not admin.",
  usage: "",
  credits: "Olol Kaang",
};

module.exports.run = async function ({ api, event }) {
  api.sendMessage("✅ This command is used internally to control bot access. You don’t need to run it manually.", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, isGroup, senderID, messageID } = event;

  // Only run in group chats
  if (!isGroup) return;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

    if (!botIsAdmin) {
      api.sendMessage(
        "🚫 I'm not an admin in this group. All commands are disabled until I become an admin.",
        threadID,
        messageID
      );

      // Optional: block further command processing
      event.blocked = true; // Signal to core to block command execution
    }
  } catch (err) {
    console.error("botadmin.js error:", err);
  }
};
