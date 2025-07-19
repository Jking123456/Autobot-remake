const twilio = require('twilio');

// Your Twilio credentials
const accountSid = 'AC01d8044aed6fa12c336f94418df17df3';
const authToken = 'f1bc6917e4a3f75a1c0519926600cf78';
const fromNumber = '+17473000907'; // Your Twilio number
const client = twilio(accountSid, authToken);

module.exports = {
  config: {
    name: "freesms",
    version: "1.0",
    author: "Homer Rebatis",
    role: 0, // 🔓 Anyone can use this command
    shortDescription: "Send free SMS using Twilio",
    longDescription: "Send SMS to Philippine numbers using Twilio API",
    category: "tools",
    guide: "{pn} 09xxxxxxxxx | your message"
  },

  onStart: async function ({ args, message }) {
    const input = args.join(" ").split("|").map(i => i.trim());

    if (input.length < 2) {
      return message.reply("❌ Usage: freesms 09xxxxxxxxx | your message here");
    }

    const phone = input[0];
    const msg = input.slice(1).join(" ");

    if (!/^09\d{9}$/.test(phone)) {
      return message.reply("❌ Invalid PH number. Use format: 09xxxxxxxxx");
    }

    const formattedPhone = phone.replace(/^0/, "+63");

    try {
      const sent = await client.messages.create({
        body: msg,
        from: fromNumber,
        to: formattedPhone
      });

      message.reply(`✅ SMS sent to ${formattedPhone}\nSID: ${sent.sid}`);
    } catch (error) {
      console.error(error);
      message.reply(`❌ Failed to send SMS:\n${error.message}`);
    }
  }
};
