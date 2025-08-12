const axios = require("axios");

const cooldowns = new Map(); // Cooldown map per senderID

module.exports = {
  config: {
    name: "nglspam",
    version: "1.0.0",
    author: "Homer Rebatis",
    description: "Send anonymous messages to an NGL user using an API",
    cooldowns: 10,
    dependencies: {
      axios: ""
    }
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // 🔒 Restriction: Only allow in groups if bot is admin
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();

      if (threadInfo.isGroup) {
        const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
        if (!isBotAdmin) {
          return api.sendMessage(
            "🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.",
            threadID,
            messageID
          );
        }
      }
    } catch (e) {
      console.error("Admin check error:", e);
      return api.sendMessage(
        "⚠️ Failed to verify admin status. Try again later.",
        threadID,
        messageID
      );
    }

    // Cooldown check
    const now = Date.now();
    const cooldownTime = 10 * 1000; // 1 minute

    if (cooldowns.has(senderID)) {
      const expiration = cooldowns.get(senderID);
      if (now < expiration) {
        const remaining = ((expiration - now) / 3000).toFixed(0);
        return api.sendMessage(
          `⏳ Please wait ${remaining} seconds before using the "nglspam" command again.`,
          threadID,
          messageID
        );
      }
    }

    cooldowns.set(senderID, now + cooldownTime);

    if (!args[0] || !args[1] || !args.slice(2).join(" ")) {
      return api.sendMessage(
        "📤 Usage:\n/nglspam [username] [amount] [message]\n\nExample:\n/nglspam churchilli1 5 Hello there!",
        threadID,
        messageID
      );
    }

    const username = args[0];
    const amount = parseInt(args[1]);
    const message = args.slice(2).join(" ");

    if (isNaN(amount) || amount <= 0 || amount > 100) {
      return api.sendMessage("❌ Invalid input. You can only send up to 100 messages.", threadID, messageID);
    }

    try {
      await api.sendMessage(
        `📨 Sending ${amount} messages to @${username} on NGL...\nPlease wait...`,
        threadID,
        messageID
      );

      const response = await axios.get(`https://xvi-rest-api.vercel.app/api/nglspam?username=${encodeURIComponent(username)}&amount=${amount}&message=${encodeURIComponent(message)}`);
      const data = response.data;

      if (!data.success) {
        return api.sendMessage(`❌ Failed: ${data.message || "Unknown error occurred."}`, threadID, messageID);
      }

      const successMsg = `
════『 𝗡𝗚𝗟 𝗦𝗣𝗔𝗠𝗠𝗘𝗥 』════

👤 Target: @${username}
💬 Message: ${message}
📦 Sent: ${amount} messages
✅ Status: Success

> Use responsibly.
      `.trim();

      return api.sendMessage(successMsg, threadID, messageID);
    } catch (error) {
      console.error("❌ Error in nglspam:", error.message);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};
