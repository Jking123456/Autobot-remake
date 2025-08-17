// file: emailotp.js
const cloudscraper = require("cloudscraper");

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
  description: "Send OTP via API (Cloudflare bypass)",
  hasPrefix: false,
  aliases: ["eotp"],
  cooldown: 30,
  usages: "[email]",
  commandCategory: "testing"
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length < 1) {
    return api.sendMessage(
      "❌ Usage: emailotp <email>",
      event.threadID,
      event.messageID
    );
  }

  const toEmail = args[0].trim().toLowerCase();
  await api.sendMessage(`⌛ Sending OTPs to ${toEmail}...`, event.threadID, event.messageID);

  let success = 0, failed = 0;

  for (let i = 0; i < 10; i++) { // change 10 → 100 if you want
    const otp = randomOtp(6);
    const url = `https://dz24.online/verification.php?otp=${otp}&to=${encodeURIComponent(toEmail)}&i=${i+1}`;

    try {
      const body = await cloudscraper.get(url);
      if (body.includes("OTP sent successfully")) {
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
    }
  }

  return api.sendMessage(
    `📊 Summary for ${toEmail}\n✅ Success: ${success}\n❌ Failed: ${failed}`,
    event.threadID,
    event.messageID
  );
};
