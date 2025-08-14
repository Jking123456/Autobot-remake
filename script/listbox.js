module.exports.config = {
  name: "listbox",
  version: "2.2.0",
  credits: "Homer Rebatis",
  role: 0,
  description: "List group threads where bot is present (private chat only, stealth mode)",
  hasPrefix: false,
  aliases: ["allbox"],
  usage: "listbox",
  cooldown: 600 // 10 minutes cooldown for stealth
};

module.exports.run = async function ({ api, event }) {
  try {
    // Only allow private chats
    if (event.isGroup) {
      return api.sendMessage(
        "🚫 This command is available only in private messages for safety. make sure your message is not End-to-End encryption chats",
        event.threadID,
        event.messageID
      );
    }

    const threads = await api.getThreadList(50, null, ["INBOX"]); // reduced to 50 for stealth
    if (!threads || !Array.isArray(threads)) throw new Error("No thread data.");

    const groupThreads = threads.filter(t => t.isGroup && t.isSubscribed);
    if (groupThreads.length === 0) {
      return api.sendMessage(
        "🤖 The bot is not currently in any group chats.",
        event.threadID,
        event.messageID
      );
    }

    let message = "📦 Groups the bot is in:\n\n";
    groupThreads.forEach((thread, index) => {
      // Prepend emoji for stealth look
      message += `🔹 ${thread.name || "Unnamed Group"}\n`;
    });

    // Send message in one go
    api.sendMessage(message.trim(), event.threadID, event.messageID);

  } catch (err) {
    console.error("LISTBOX ERROR:", err);
    return api.sendMessage(
      `❌ Failed to retrieve group threads.\n\nError: ${err.message}`,
      event.threadID,
      event.messageID
    );
  }
};
