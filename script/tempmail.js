const axios = require("axios");

let currentTempMail = null; // Store current temp email and token

module.exports.config = {
  name: "tempmail",
  version: "1.1.0",
  description: "Generate temporary emails and check inbox (admin only)",
  cooldowns: 10,
  permissions: 0
};

module.exports.run = async function({ api, event, args, Users }) {
  const command = args[0]?.toLowerCase();

  // Check if the command is used in a group
  if (event.isGroup) {
    try {
      const botInfo = await api.getUserInfo(event.selfID);
      const groupAdmins = await api.getThreadInfo(event.threadID);

      const botIsAdmin = groupAdmins.adminIDs.some(admin => admin.id === event.selfID);

      if (!botIsAdmin) {
        return api.sendMessage(
          "❌ I must be an admin in this group to use temp mail commands.",
          event.threadID
        );
      }
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to check admin status.", event.threadID);
    }
  }

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
  } else if (command === "inbox") {
    if (!currentTempMail) {
      return api.sendMessage("❌ No temp email generated yet. Use 'temp gen' first.", event.threadID);
    }

    try {
      const inboxResponse = await axios.get(
        `https://haji-mix.up.railway.app/api/tempinbox?token=${currentTempMail.token}`
      );
      const messages = inboxResponse.data;

      if (!messages || messages.length === 0) {
        return api.sendMessage("📭 No message received yet.", event.threadID);
      }

      let inboxText = "📬 Inbox Messages:\n\n";
      messages.forEach((msg, index) => {
        inboxText += `${index + 1}. From: ${msg.from}\n   Subject: ${msg.subject}\n   Body: ${msg.body}\n\n`;
      });

      return api.sendMessage(inboxText, event.threadID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Failed to fetch inbox messages.", event.threadID);
    }
  } else {
    return api.sendMessage("❌ Invalid command. Use:\n- temp gen\n- temp inbox", event.threadID);
  }
};
