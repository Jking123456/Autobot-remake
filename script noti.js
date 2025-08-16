module.exports.config = {
  name: "noti",
  version: "1.0.0",
  credits: "Homer Rebatis",
  description: "Send notification message to all groups",
  commandCategory: "System",
  usages: "[message]",
  role: 2, // Only Bot Admin can use (role:2)
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) {
    return api.sendMessage("⚠️ Please enter the message you want to send as notification.", event.threadID, event.messageID);
  }

  const msg = args.join(" ");
  const allThreads = await api.getThreadList(100, null, ["INBOX"]);
  let sentCount = 0;
  let failedCount = 0;

  for (const thread of allThreads) {
    if (thread.isGroup && thread.threadID !== event.threadID) {
      try {
        await api.sendMessage(`📢 [Notification]\n\n${msg}`, thread.threadID);
        sentCount++;
      } catch (e) {
        failedCount++;
      }
    }
  }

  return api.sendMessage(
    `✅ Notification sent!\n\n📤 Sent to: ${sentCount} groups\n❌ Failed: ${failedCount}`,
    event.threadID,
    event.messageID
  );
};
