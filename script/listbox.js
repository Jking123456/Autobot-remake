module.exports.config = {
  name: "listbox",
  version: "2.0.0",
  credits: "Homer Rebatis",
  role: 0,
  description: "Lists all group threads (inbox) the bot is part of",
  hasPrefix: false,
  aliases: ["allbox"],
  usage: "listbox",
  cooldown: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    // Get up to 1000 threads; you can adjust the limit
    const threads = await api.getThreadList(1000, null, ["INBOX"]);

    // Filter only group threads
    const groupThreads = threads.filter(thread => thread.isGroup && thread.isSubscribed);

    if (groupThreads.length === 0) {
      return api.sendMessage("🤖 Bot is not in any group chats.", event.threadID, event.messageID);
    }

    let output = "📦 All Group Threads:\n\n";
    let count = 1;
    for (const thread of groupThreads) {
      const name = thread.name || "Unnamed Group";
      output += `${count++}. ${name}\n🆔 ID: ${thread.threadID}\n\n`;
    }

    return api.sendMessage(output.trim(), event.threadID, event.messageID);
  } catch (err) {
    console.error("LISTBOX ERROR:", err);
    return api.sendMessage("❌ Failed to retrieve thread list.", event.threadID, event.messageID);
  }
};
