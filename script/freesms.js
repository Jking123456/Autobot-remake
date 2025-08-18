const axios = require("axios");

module.exports.config = {
  name: "freesms",
  version: "1.0.0",
  role: 0,
  credits: "Homer Rebatis",
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
        "❌ Usage: freesms <number> | <message>\n\n📌 Example:\n" +
        "freesms 09123456789 | Hello, this is a test message.",
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

    // Send request to API
    const res = await axios.post("https://freetextph.up.railway.app/oten", {
      number,
      message
    });

    const data = res.data;

    if (data.success) {
      return api.sendMessage(
        `✅ SMS Sent Successfully!\n\n📱 To: ${number}\n💬 Message: ${message}\n\n📝 Status: ${data.message}\n📊 Limit Remaining: ${data.data.limit}\n⏳ Send Delay: ${data.data.sendDelay}s`,
        event.threadID,
        event.messageID
      );
    } else {
      return api.sendMessage(
        `❌ Failed to send SMS.\nReason: ${data.message || "Unknown error"}`,
        event.threadID,
        event.messageID
      );
    }
  } catch (err) {
    console.error(err);
    return api.sendMessage(
      "🚨 Error: Could not connect to FreeTextPH API.",
      event.threadID,
      event.messageID
    );
  }
};
