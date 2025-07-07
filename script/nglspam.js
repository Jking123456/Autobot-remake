const axios = require("axios");

module.exports = {
  config: {
    name: "nglspam",
    version: "1.0.0",
    author: "vernex",
    description: "Send anonymous messages to an NGL user using an API",
    cooldowns: 10,
    dependencies: {
      axios: ""
    }
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

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
