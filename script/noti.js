const fs = require("fs-extra");

module.exports.config = {
  name: "noti",
  version: "1.2.3",
  role: 1,
  description: "Sends a formatted message to all group threads (Admin only). Supports \\n for line breaks.",
  hasPrefix: false,
  aliases: ["noti"],
  usages: "[Text]",
  cooldown: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const rawMessage = args.join(" ").trim();
  if (!rawMessage) return api.sendMessage("⚠️ Please provide a message.", event.threadID);

  const MAX_SEND = 20;

  // Convert \n to actual line breaks
  const formattedMessage = rawMessage.replace(/\\n/g, "\n");

  const header = "𝙉𝙊𝙏𝙄𝘾𝙀 𝙁𝙍𝙊𝙈 𝘿𝙀𝙑𝙀𝙇𝙊𝙋𝙀𝙍\n----------------\nDeveloper: HOMER REBATIS\n----------------";
  const fullMessage = `${header}\n『𝗡𝗼𝘁𝗶𝗰𝗲』\n${formattedMessage}`;

  let sentCount = 0;

  const threadList = await api.getThreadList(100, null, ["INBOX"]);

  for (const thread of threadList) {
    if (sentCount >= MAX_SEND) break;
    if (!thread.isGroup || thread.threadID === event.threadID) continue;

    try {
      await api.sendMessage(fullMessage, thread.threadID);
      sentCount++;
      await delay(1000); // Delay to avoid being rate-limited
    } catch (err) {
      console.error(`❌ Error sending to thread ${thread.threadID}:`, err.message);
    }
  }

  const feedbackMsg = sentCount > 0
    ? `✅ Successfully sent the notification to ${sentCount} group(s).`
    : "⚠️ No eligible group threads found to send the message.";

  return api.sendMessage(feedbackMsg, event.threadID);
};

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
