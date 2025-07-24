const puppeteer = require('puppeteer');
const axios = require('axios');

const cooldowns = new Map(); // cooldown per sender

module.exports.config = {
  name: "freesms",
  version: "1.0.0",
  role: 0,
  credits: "Homer Rebatis + ChatGPT",
  aliases: [],
  usages: "<number> <message>",
  cooldown: 2,
};

async function getTurnstileToken() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://freemessagetext.vercel.app', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  await page.waitForSelector('.cf-turnstile iframe');

  await page.evaluate(() => {
    window.turnstileToken = "";
    window.onTurnstileCallback = function (token) {
      window.turnstileToken = token;
    };
  });

  const token = await page.waitForFunction(() => window.turnstileToken?.length > 0, {
    timeout: 60000
  }).then(() => page.evaluate(() => window.turnstileToken));

  await browser.close();
  return token;
}

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  // Admin-only check in groups
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command can only be used in groups where the bot is an admin.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Couldn't verify bot permissions. Try again later.", threadID, messageID);
  }

  // Cooldown check
  const now = Date.now();
  if (cooldowns.has(senderID)) {
    const elapsed = now - cooldowns.get(senderID);
    if (elapsed < 60 * 1000) {
      const waitTime = Math.ceil((60 * 1000 - elapsed) / 1000);
      return api.sendMessage(`⏳ Please wait ${waitTime} second(s) before using this command again.`, threadID, messageID);
    }
  }

  if (args.length < 2) {
    return api.sendMessage("❌ Usage: freesms <number> <message>\n\nExample: freesms +639123456789 Hello world!", threadID, messageID);
  }

  const number = args[0];
  const text = args.slice(1).join(" ");

  try {
    cooldowns.set(senderID, now);
    api.sendMessage("📡 Sending SMS, solving CAPTCHA...", threadID, messageID);

    const token = await getTurnstileToken();

    const apiUrl = `https://freemessagetext.vercel.app/api/send?number=${encodeURIComponent(number)}&text=${encodeURIComponent(text)}&cf-turnstile-token=${token}`;

    const res = await axios.get(apiUrl);
    const data = res.data;

    if (data.success && data.response?.success === 1) {
      const { message, totalsent, limit, sendDelay, adfreq } = data.response;
      return api.sendMessage(
        `✅ ${message}\n🔢 Total Sent: ${totalsent} / ${limit}\n🕒 Delay: ${sendDelay}s\n📢 Ad Frequency: ${adfreq}`,
        threadID, messageID
      );
    } else {
      return api.sendMessage("❌ Failed: " + (data.response?.message || "Unknown error"), threadID, messageID);
    }
  } catch (err) {
    console.error("SMS Error:", err);
    return api.sendMessage("❌ Error: " + err.message, threadID, messageID);
  }
};
