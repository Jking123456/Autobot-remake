// file: emailotp.js
const axios = require("axios");

function randomOtp(n = 6) {
  const min = Math.pow(10, n - 1);
  const max = Math.pow(10, n) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports.config = {
  name: "emailotp",
  version: "1.2.0",
  role: 0,
  credits: "Homer Rebatis",
  description: "Send multiple random OTPs via dz24.online API (summary only)",
  hasPrefix: false,
  aliases: ["eotp", "otpemail"],
  cooldown: 15,
  usages: "[email] [count] [delayMs]",
  commandCategory: "utility"
};

module.exports.run = async function ({ api, event, args }) {
  try {
    if (args.length < 1) {
      return api.sendMessage(
        "❌ Usage: emailotp <email> [count] [delayMs]\n" +
        "Example: emailotp you@example.com 10 1500",
        event.threadID,
        event.messageID
      );
    }

    const toEmail = args[0].trim().toLowerCase();
    let count = parseInt(args[1]) || 10;          // how many OTPs
    let delayMs = parseInt(args[2]) || 1200;      // delay between requests
    if (count < 1) count = 1;
    if (count > 20) count = 20;                   // safety cap

    // We’ll only send a start + final summary message
    await api.sendMessage(
      `⌛ Working… sending ${count} OTP(s) to ${toEmail}. I’ll post a single summary when done.`,
      event.threadID,
      event.messageID
    );

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "Accept": "text/plain,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://dz24.online/",
      "Connection": "keep-alive"
    };

    const results = [];
    const concurrency = 2; // small parallelism helps speed without hammering the server

    let nextIndex = 0;
    async function worker() {
      while (nextIndex < count) {
        const i = nextIndex++;
        const otp = randomOtp(6);
        const url = `https://dz24.online/verification.php?otp=${otp}&to=${encodeURIComponent(toEmail)}&i=1`;
        try {
          // validateStatus => we capture non-2xx (e.g., 403) instead of throwing
          const res = await axios.get(url, {
            responseType: "text",
            timeout: 15000,
            headers,
            validateStatus: () => true
          });
          const status = res.status;
          const text = typeof res.data === "string" ? res.data : String(res.data);
          const ok = status >= 200 && status < 300 && /success/i.test(text);
          results.push({ idx: i + 1, otp, status, text, ok });
        } catch (err) {
          const status = err.response?.status || 0;
          const text = err.response?.data ? String(err.response.data) : err.message;
          results.push({ idx: i + 1, otp, status, text, ok: false });
        }
        // jittered delay even with concurrency
        if (delayMs > 0) await sleep(delayMs + Math.floor(Math.random() * 200));
      }
    }

    // Run a small pool
    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    const success = results.filter(r => r.ok).length;
    const failed = results.length - success;
    const f403 = results.filter(r => r.status === 403).length;

    const preview = results.slice(0, 10).map(r => {
      const tag = r.ok ? "🟢" : "🔴";
      const body = (r.text || "").replace(/\s+/g, " ").slice(0, 120);
      return `${tag} [${r.idx}/${count}] status ${r.status} | OTP ${r.otp} — ${body}`;
    }).join("\n");

    let summary =
      `📊 Summary for ${toEmail}\n` +
      `Total: ${count}\n` +
      `🟢 Success: ${success}\n` +
      `🔴 Failed: ${failed}\n` +
      (f403 ? `🚧 403 Forbidden: ${f403}\n` : "") +
      `\nFirst ${Math.min(10, results.length)} results:\n${preview}`;

    return api.sendMessage(summary, event.threadID, event.messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage(
      "🚨 Error: Could not run emailotp. Check logs.",
      event.threadID,
      event.messageID
    );
  }
};
