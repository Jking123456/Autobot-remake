const axios = require("axios");

module.exports.config = {
  name: "freesms2",
  version: "1.2.0",
  role: 0,
  credits: "Marjhun Baylon + Aligno Akoeh",
  description: "Send free SMS via FreeTextPH API",
  hasPrefix: false,
  aliases: ["fsms", "sms2"],
  cooldown: 15,
  usages: "[number] | [message]",
  commandCategory: "utility"
};

module.exports.run = async function({ api, event, args }) {
  try {
    if (args.length < 2) {
      return api.sendMessage(
        "❌ Usage: freesms2 <number> | <message>\n\n📌 Example:\n" +
        "freesms2 09123456789 | Hello, this is a test message.",
        event.threadID,
        event.messageID
      );
    }

    const content = args.join(" ").split("|");
    const number = content[0].trim();
    const message = content.slice(1).join("|").trim();

    if (!number || !message) {
      return api.sendMessage(
        "⚠️ Please provide both number and message.\nFormat: <number> | <message>",
        event.threadID,
        event.messageID
      );
    }

    // React ⌛ while processing
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    // Send request to API
    const res = await axios.post("https://freetextph.up.railway.app/send", {
      number,
      message
    });

    const data = res.data;

    // Random delay between 5–7 seconds
    const delay = Math.floor(Math.random() * 2000) + 5000; // 5000–7000 ms

    setTimeout(() => {
      if (data.success) {
        // React 🟢 success
        api.setMessageReaction("🟢", event.messageID, () => {}, true);

        api.sendMessage(
          `✅ SMS Sent Successfully!\n\n📱 To: ${number}\n💬 Message: ${message}\n\n📝 Status: ${data.message}\n📊 Limit Remaining: ${data.data.limit}\n⏳ Send Delay: ${data.data.sendDelay}s`,
          event.threadID,
          event.messageID
        );
      } else {
        // React 🔴 error
        api.setMessageReaction("🔴", event.messageID, () => {}, true);

        api.sendMessage(
          `❌ Failed to send SMS.\nReason: ${data.message || "Unknown error"}`,
          event.threadID,
          event.messageID
        );
      }
    }, delay);

  } catch (err) {
    console.error(err);

    // React 🔴 error
    api.setMessageReaction("🔴", event.messageID, () => {}, true);

    return api.sendMessage(
      "🚨 Error: Could not connect to FreeTextPH API.",
      event.threadID,
      event.messageID
    );
  }
};
