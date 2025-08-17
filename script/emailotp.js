const axios = require("axios");

function randomOtp(n = 6) {
  const min = Math.pow(10, n - 1);
  const max = Math.pow(10, n) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

// simple sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.config = {
  name: "emailotp",
  version: "1.1.0",
  role: 0,
  credits: "Homer Rebatis",
  description: "Send multiple random OTPs via dz24.online API",
  hasPrefix: false,
  aliases: ["eotp", "otpemail"],
  cooldown: 15,
  usages: "[email] [count]",
  commandCategory: "utility"
};

module.exports.run = async function ({ api, event, args }) {
  try {
    if (args.length < 1) {
      return api.sendMessage(
        "❌ Usage: emailotp <email> [count]\n\n📌 Example:\n" +
        "emailotp you@example.com 10",
        event.threadID,
        event.messageID
      );
    }

    const toEmail = args[0].trim().toLowerCase();
    let count = parseInt(args[1]) || 10;
    if (count < 1) count = 1;
    if (count > 20) count = 20; // safety cap at 20

    await api.sendMessage(
      `⌛ Sending ${count} OTP(s) to ${toEmail}… (with short delays)`,
      event.threadID,
      event.messageID
    );

    let success = 0;
    let fail = 0;

    for (let i = 0; i < count; i++) {
      const otp = randomOtp(6);
      const url = `https://dz24.online/verification.php?otp=${otp}&to=${encodeURIComponent(toEmail)}&i=1`;

      try {
        const res = await axios.get(url, { responseType: "text", timeout: 10000 });
        const text = typeof res.data === "string" ? res.data : String(res.data);

        if (/success/i.test(text)) {
          success++;
          await api.sendMessage(
            `✅ [${i + 1}/${count}] OTP sent!\n📧 To: ${toEmail}\n🔢 OTP: ${otp}\n📝 ${text}`,
            event.threadID
          );
        } else {
          fail++;
          await api.sendMessage(
            `❌ [${i + 1}/${count}] Failed.\n📧 To: ${toEmail}\n🔢 OTP: ${otp}\n📝 ${text}`,
            event.threadID
          );
        }
      } catch (err) {
        fail++;
        await api.sendMessage(
          `🚨 [${i + 1}/${count}] Error while sending OTP: ${err.message}`,
          event.threadID
        );
      }

      // delay between sends (1.5s)
      if (i < count - 1) await sleep(1500);
    }

    return api.sendMessage(
      `📊 Done! Sent ${count} OTP(s) to ${toEmail}.\n🟢 Success: ${success}\n🔴 Failed: ${fail}`,
      event.threadID,
      event.messageID
    );
  } catch (err) {
    console.error(err);
    return api.sendMessage(
      "🚨 Error: Could not connect to dz24.online API.",
      event.threadID,
      event.messageID
    );
  }
};
