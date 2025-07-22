const cooldown = new Map();

module.exports.config = {
  name: "botadmin",
  version: "1.0.2",
  role: 0,
  hasPrefix: true,
  aliases: [],
  description: "Block commands if bot is not admin in group.",
  usage: "",
  credits: "Olol Kaang",
};

module.exports.run = async function ({ api, event }) {
  api.sendMessage("✅ Internal command. No need to run this manually.", event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, isGroup, messageID, senderID } = event;

  // ✅ Prevent the bot from replying to itself
  if (senderID == api.getCurrentUserID()) return;

  if (!isGroup) return;

  try {
    const now = Date.now();
    const lastWarn = cooldown.get(threadID) || 0;
    const cooldownDuration = 60 * 1000;

    if (now - lastWarn < cooldownDuration) {
      event.blocked = true;
      return;
    }

    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

    if (!botIsAdmin) {
      cooldown.set(threadID, now); // Update cooldown
      event.blocked = true;
      api.sendMessage(
        "🚫 I'm not an admin in this group. All commands are disabled until I become an admin.",
        threadID,
        messageID
      );
    }
  } catch (err) {
    console.error("botadmin.js error:", err);
  }
};
