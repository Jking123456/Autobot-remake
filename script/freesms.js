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
      headless: "new", // Required for Puppeteer v22+
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Set user agent and viewport to mimic real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.1 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    // Load page with extended timeout
    await page.goto("https://freemessagetext.vercel.app/", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Optional: wait for iframe to fully finish loading
    await page.waitForSelector('.cf-turnstile iframe', { timeout: 20000 });

    // Wait and extract Turnstile token from hidden textarea
    const token = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          const input = document.querySelector('textarea[name="cf-turnstile-response"]');
          if (input && input.value.trim().length > 0) {
            clearInterval(interval);
            resolve(input.value.trim());
          }
        }, 500);
        setTimeout(() => reject(new Error("Timeout getting Turnstile token")), 20000);
      });
    });

    await browser.close();

    // Use token to send SMS
    const res = await axios.get("https://freemessagetext.vercel.app/api/send", {
      params: {
        number,
        text: message,
        "cf-turnstile-token": token
      }
    });

    const result = res.data;

    if (result.success && result.response && result.response.success === 1) {
      api.sendMessage(`✅ Message sent to ${number}!\n📩 ${result.response.message}`, threadID, messageID);
    } else {
      api.sendMessage(`❌ Failed to send message:\n${JSON.stringify(result, null, 2)}`, threadID, messageID);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
