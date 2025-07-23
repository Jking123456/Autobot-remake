module.exports.config = {
  name: "listbox",
  version: "2.1.0",
  credits: "Homer Rebatis",
  role: 0,
  description: "List group threads where bot is present",
  hasPrefix: false,
  aliases: ["allbox"],
  usage: "listbox",
  cooldown: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    if (!threads || !Array.isArray(threads)) throw new Error("No thread data.");

    const groupThreads = threads.filter(t => t.isGroup && t.isSubscribed);
    if (groupThreads.length === 0) {
      return api.sendMessage("🤖 Bot is not in any group chats.", event.threadID, event.messageID);
    }

    let message = "📦 Group Threads the bot is in:\n\n";
    groupThreads.forEach((thread, index) => {
      message += `${index + 1}. ${thread.name || "Unnamed Group"}\n🆔 ${thread.threadID}\n\n`;
    });

    api.sendMessage(message.trim(), event.threadID, event.messageID);
  } catch (err) {
    console.error("LISTBOX ERROR:", err);
    return api.sendMessage(`❌ Failed to retrieve thread list.\n\nError: ${err.message}`, event.threadID, event.messageID);
  }
};
