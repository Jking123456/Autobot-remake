// file: emailotp.js
const axios = require("axios");

function randomOtp(n = 6) {
  const min = Math.pow(10, n - 1);
  const max = Math.pow(10, n) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

module.exports.config = {
  name: "emailotp",
  version: "2.0.0",
  role: 0,
  credits: "Homer Rebatis",
  description: "Send multiple OTPs via API",
  hasPrefix: false,
  aliases: ["otpspam", "sendotp"],
  cooldown: 30,
  usages: "<email> [count]",
  commandCategory: "testing"
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length < 1) {
    return api.sendMessage(
      "❌ Usage: emailotp <email> [count]",
      event.threadID,
      event.messageID
    );
  }

  const toEmail = args[0].trim().toLowerCase();
  const count = parseInt(args[1]) || 10; // default 10 OTPs

  await api.sendMessage(
    `⌛ Sending ${count} OTPs to ${toEmail}...`,
    event.threadID,
    event.messageID
  );

  let success = 0, failed = 0;

  for (let i = 0; i < count; i++) {
    const otp = randomOtp(6);
    try {
      const res = await axios.get(
        `https://dz24.online/verification.php?otp=${otp}&to=${encodeURIComponent(toEmail)}&i=1`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Referer": "https://dz24.online/",
            "Connection": "keep-alive",
          },
          timeout: 10000,
        }
      );

      if (res.status === 200 && res.data.includes("OTP sent successfully")) {
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
    }
  }

  return api.sendMessage(
    `📊 Summary for ${toEmail}\n` +
      `Total: ${count}\n` +
      `🟢 Success: ${success}\n` +
      `🔴 Failed: ${failed}`,
    event.threadID,
    event.messageID
  );
};
