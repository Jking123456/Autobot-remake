const puppeteer = require('puppeteer');
const axios = require('axios');

module.exports.config = {
  name: "freesms",
  version: "1.0.0",
  role: 0,
  hasPrefix: true,
  credits: "ChatGPT + Homer",
  description: "Send free SMS using Turnstile bypass",
  usages: "[number] [message]",
  cooldown: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;

  const number = args[0];
  const message = args.slice(1).join(" ");

  if (!number || !message) {
    return api.sendMessage("❌ Usage: freesms <number> <message>", threadID, messageID);
  }

  try {
    api.sendMessage("⏳ Getting Turnstile token, please wait...", threadID, messageID);

    const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});
    const page = await browser.newPage();

    await page.goto("https://freemessagetext.vercel.app/", { waitUntil: "networkidle0" });

    // Wait for CAPTCHA container
    await page.waitForSelector('.cf-turnstile iframe', { timeout: 10000 });

    // Evaluate to get the token from the iframe (Turnstile auto submits after solving)
    const token = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          const input = document.querySelector('textarea[name="cf-turnstile-response"]');
          if (input && input.value.trim().length > 0) {
            clearInterval(interval);
            resolve(input.value.trim());
          }
        }, 500);
        setTimeout(() => reject("Timeout getting token"), 15000);
      });
    });

    await browser.close();

    // Use token to send SMS
    const res = await axios.get(`https://freemessagetext.vercel.app/api/send`, {
      params: {
        number: number,
        text: message,
        "cf-turnstile-token": token
      }
    });

    const result = res.data;

    if (result.success && result.response && result.response.success == 1) {
      api.sendMessage(`✅ Message sent to ${number}!\n📩 ${result.response.message}`, threadID, messageID);
    } else {
      api.sendMessage(`❌ Failed to send message:\n${JSON.stringify(result, null, 2)}`, threadID, messageID);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
