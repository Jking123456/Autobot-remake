const twilio = require("twilio");

const accountSid = "AC01d8044aed6fa12c336f94418df17df3"; // Replace with your real SID
const authToken = "f1bc6917e4a3f75a1c0519926600cf78"; // Replace with your real token
const fromNumber = "+17473000907"; // Your Twilio number or registered sender ID

const client = twilio(accountSid, authToken);

module.exports.config = {
  name: "freesms",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0, // 0 = everyone
  credits: "Homer Rebatis",
  description: "Send SMS to PH number using Twilio",
  commandCategory: "tools",
  usages: "freesms 09xxxxxxxxx | your message",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const input = args.join(" ").split("|").map(str => str.trim());

    if (input.length < 2) {
      return api.sendMessage(
        "❗ Usage: freesms 09xxxxxxxxx | your message",
        event.threadID,
        event.messageID
      );
    }

    const phone = input[0];
    const messageText = input.slice(1).join(" ");

    if (!/^09\d{9}$/.test(phone)) {
      return api.sendMessage("❌ Invalid PH number. Use format: 09xxxxxxxxx", event.threadID, event.messageID);
    }

    const formattedPhone = phone.replace(/^0/, "+63");

    const sent = await client.messages.create({
      body: messageText,
      from: fromNumber,
      to: formattedPhone
    });

    return api.sendMessage(
      `✅ SMS sent to ${formattedPhone}\n🆔 SID: ${sent.sid}`,
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error("Twilio SMS Error:", error);
    return api.sendMessage(
      `❌ Failed to send SMS:\n${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};
