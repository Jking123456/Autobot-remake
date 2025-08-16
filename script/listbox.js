module.exports.config = {
  name: "listbox",
  version: "2.2.1",
  credits: "Homer Rebatis",
  role: 0,
  description: "List group threads where bot is present (private chat only, stealth mode)",
  hasPrefix: false,
  aliases: ["allbox"],
  usage: "listbox",
  cooldown: 600 // 10 minutes cooldown
};

function getThreadList(api, limit = 50, timestamp = null, tags = ["INBOX"]) {
  return new Promise((resolve, reject) => {
    api.getThreadList(limit, timestamp, tags, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

module.exports.run = async function ({ api, event }) {
  try {
    // Allow only in private chat
    if (event.threadID !== event.senderID) {
      return api.sendMessage(
        "🚫 This command works only in private messages (not groups / not end-to-end encrypted).",
        event.threadID,
        event.messageID
      );
    }

    // Fetch threads safely
    const threads = await getThreadList(api, 50, null, ["INBOX"]);

    if (!threads || !Array.isArray(threads)) throw new Error("No thread data returned.");

    const groupThreads = threads.filter(t => t.isGroup && t.isSubscribed);

    if (groupThreads.length === 0) {
      return api.sendMessage("🤖 The bot is not currently in any group chats.", event.threadID, event.messageID);
    }

    let message = "📦 Groups the bot is in:\n\n";
    groupThreads.forEach((thread, index) => {
      message += `🔹 ${thread.name || "Unnamed Group"}\n`;
    });

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
