const axios = require("axios");

const cooldowns = {}; // per user cooldown
const COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 24 hours

module.exports.config = {
  name: "shield",
  version: "1.1.0",
  role: 0,
  hasPrefix: true,
  aliases: ["fbshield"],
  description: "Toggle Facebook Profile Shield using access token (private only).",
  usage: "fbshield <token> | <on/off>",
  credits: "Vern",
  cooldown: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const { senderID, threadID, messageID } = event;

  // ✅ Private messages only
  if (String(threadID).startsWith("-")) {
    return api.sendMessage(
      "🚫 This command is available only in private messages.",
      threadID,
      messageID
    );
  }

  // ✅ Cooldown check per user
  if (cooldowns[senderID]) {
    const remaining = COOLDOWN_DURATION - (Date.now() - cooldowns[senderID]);
    if (remaining > 0) {
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return api.sendMessage(
        `⏳ Please wait ${hours}h ${minutes}m before using "fbshield" again.`,
        threadID,
        messageID
      );
    }
  }

  // Parse arguments
  const input = args.join(" ").split("|").map(i => i.trim());
  if (input.length < 2) {
    return api.sendMessage(
      `❗ Usage:\nfbshield <token> | <on/off>\nExample:\nfbshield EAA...ZDZD | on`,
      threadID,
      messageID
    );
  }

  const [token, toggle] = input;
  const enable = toggle.toLowerCase() === "on" ? "true" : toggle.toLowerCase() === "off" ? "false" : null;

  if (!enable) {
    return api.sendMessage("❌ Invalid toggle value. Use `on` or `off`.", threadID, messageID);
  }

  // ✅ Optional confirmation prompt
  await api.sendMessage(
    `⚠️ You are about to ${enable === "true" ? "enable" : "disable"} Profile Shield. Reply "yes" to confirm.`,
    threadID
  );

  // Listen for confirmation
  const listener = async (event2) => {
    if (event2.senderID !== senderID || event2.threadID !== threadID) return;

    const msg = event2.body?.trim().toLowerCase();
    if (msg === "yes") {
      api.removeListener("message", listener); // stop listening after confirmation

      const url = `https://wrapped-rest-apis.vercel.app/api/guard?token=${encodeURIComponent(token)}&enable=${enable}`;

      try {
        const res = await axios.get(url);
        if (res.data?.result?.success) {
          cooldowns[senderID] = Date.now(); // set cooldown
          return api.sendMessage(
            `🛡️ Profile Shield ${enable === "true" ? "enabled" : "disabled"} successfully.`,
            threadID,
            messageID
          );
        } else {
          return api.sendMessage(
            "❌ Failed to update profile shield. Make sure the token is valid.",
            threadID,
            messageID
          );
        }
      } catch (err) {
        console.error("fbshield error:", err.message);
        return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
      }
    } else {
      api.removeListener("message", listener);
      return api.sendMessage("❌ Action cancelled.", threadID, messageID);
    }
  };

  api.on("message", listener);
};
