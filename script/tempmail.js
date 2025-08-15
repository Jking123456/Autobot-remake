const axios = require("axios");

let currentTempMail = null; // Store current temp email and token

module.exports.config = {
  name: "temp", // Users type 'temp gen' or 'temp inbox'
  version: "1.3.0",
  description: "Generate temporary emails and check inbox",
  cooldowns: 10,
  permissions: 0
};

module.exports.run = async function({ api, event, args }) {
  const command = args[0]?.toLowerCase();

  if (!command) {
    return api.sendMessage("❌ Invalid command. Use:\n- temp gen\n- temp inbox", event.threadID);
  }

  // Generate temporary email
  if (command === "gen") {
    try {
      const response = await axios.get("https://haji-mix.up.railway.app/api/tempgen");
      const data = response.data;

      currentTempMail = {
        email: data.email,
        token: data.token
      };

      return api.sendMessage(
        `✅ Temporary Email Generated:\n\nEmail: ${data.email}\nToken: ${data.token}`,
        event.threadID
      );
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to generate temp email.", event.threadID);
    }
  } 

  // Fetch inbox messages
  else if (command === "inbox") {
    if (!currentTempMail) {
      return api.sendMessage("❌ No temp email generated yet. Use 'temp gen' first.", event.threadID);
    }

    try {
      const inboxResponse = await axios.get(
        `https://haji-mix.up.railway.app/api/tempinbox?token=${currentTempMail.token}`
      );

      const messages = inboxResponse.data.emails || [];

      if (messages.length === 0) {
        return api.sendMessage("📭 No message received yet.", event.threadID);
      }

      let inboxText = "📬 Inbox Messages:\n\n";
      messages.forEach((msg, index) => {
        inboxText += `${index + 1}. From: ${msg.from || "Unknown"}\n   Subject: ${msg.subject || "No Subject"}\n   Body: ${msg.body || "Empty"}\n\n`;
      });

      return api.sendMessage(inboxText, event.threadID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to fetch inbox messages.", event.threadID);
    }
  } 

  // Invalid command
  else {
    return api.sendMessage("❌ Invalid command. Use:\n- temp gen\n- temp inbox", event.threadID);
  }
};
