module.exports.config = {
  name: "listbox",
  version: "2.0.0",
  credits: "Homer Rebatis + Modified",
  role: 0,
  description: "Lists all group threads (inbox) the bot is part of",
  hasPrefix: false,
  aliases: ["allbox"],
  usage: "listbox",
  cooldown: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    const threads = await api.getThreadList(20, null, ["INBOX"]);

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
    return api.sendMessage(
      `❌ Failed to retrieve thread list.\n\nError: ${err.message || JSON.stringify(err)}`,
      event.threadID,
      event.messageID
    );
  }
};
