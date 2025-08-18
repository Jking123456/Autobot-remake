// file: emailotp-cloud.js
const cloudscraper = require("cloudscraper");

function randomOtp(n = 6) {
  const min = Math.pow(10, n - 1);
  const max = Math.pow(10, n) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

module.exports.config = {
  name: "emailotpcloud",
  version: "1.2.0",
  role: 0,
  credits: "Homer Rebatis",
  description: "Send multiple OTPs using Cloudscraper (POST mode, Cloudflare bypass)",
  hasPrefix: false,
  aliases: ["eotpcloud", "otpcloud"],
  cooldown: 30,
  usages: "[email] [count]",
  commandCategory: "utility"
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length < 1) {
    return api.sendMessage(
      "❌ Usage: emailotpcloud <email> [count]\n\n📌 Example:\nemailotpcloud test@mail.com 10",
      event.threadID,
      event.messageID
    );
  }

  const toEmail = args[0].trim().toLowerCase();
  const count = parseInt(args[1]) || 10;

  await api.sendMessage(
    `⌛ Sending ${count} OTPs to ${toEmail} (using Cloudscraper POST)...`,
    event.threadID,
    event.messageID
  );

  let success = 0, failed = 0;

  for (let i = 0; i < count; i++) {
    const otp = randomOtp(6);

    try {
      const res = await cloudscraper.post({
        uri: "https://dz24.online/verification.php",
        form: {
          otp: otp,
          to: toEmail,
          i: 1
        },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36",
          "Referer": "https://dz24.online/",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "*/*"
        },
        resolveWithFullResponse: false
      });

      if (res && res.toLowerCase().includes("successfully")) {
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
    }

    // small delay (1–2s) to reduce rate-limit
    await new Promise(r => setTimeout(r, 1500));
  }

  return api.sendMessage(
    `📊 Summary for ${toEmail}\n✅ Success: ${success}\n❌ Failed: ${failed}`,
    event.threadID,
    event.messageID
  );
};
