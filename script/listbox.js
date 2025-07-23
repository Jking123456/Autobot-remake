module.exports.config = {
  name: "listbox",
  version: "2.0.1",
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
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    if (!Array.isArray(threads)) {
      return api.sendMessage("⚠️ No thread list returned. Check session/login.", event.threadID);
    }

    const groups = threads.filter(t => t.isGroup && t.isSubscribed);
    if (groups.length === 0) return api.sendMessage("🤖 Bot is not in any group chats.", event.threadID);

    const msg = groups.map((g, i) =>
      `${i + 1}. ${g.name || "Unnamed Group"}\n🆔 ${g.threadID}`
    ).join("\n\n");

    return api.sendMessage(`📦 Group Threads:\n\n${msg}`, event.threadID);
  } catch (e) {
    console.error("LISTBOX ERROR:", e);
    return api.sendMessage("❌ Failed to retrieve thread list.", event.threadID);
  }
};
