const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const axios = require("axios");

puppeteer.use(StealthPlugin());

module.exports.config = {
  name: "freesms",
  version: "1.0.2",
  role: 0,
  hasPrefix: true,
  credits: "ChatGPT + Homer",
  description: "Send free SMS using Turnstile bypass",
  usages: "[number] [message]",
  cooldown: 10
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const number = args[0];
  const message = args.slice(1).join(" ");

  if (!number || !message) {
    return api.sendMessage("❌ Usage: freesms <number> <message>", threadID, messageID);
  }

  try {
    api.sendMessage("⏳ Solving CAPTCHA, please wait...", threadID, messageID);

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.1 Safari/537.36"
    );

    await page.goto("https://freemessagetext.vercel.app/", {
      waitUntil: "networkidle2",
      timeout: 120000
    });

    // ✅ Wait for Turnstile container
    await page.waitForSelector(".cf-turnstile", { timeout: 120000 });

    // ✅ Wait for token to be generated
    await page.waitForFunction(() => {
      const el = document.querySelector('[name="cf-turnstile-response"]');
      return el && el.value.length > 10;
    }, { timeout: 120000 });

    // ✅ Extract token
    const token = await page.$eval('[name="cf-turnstile-response"]', el => el.value);

    await browser.close();

    if (!token || token.length < 10) {
      return api.sendMessage("❌ Failed to retrieve CAPTCHA token.", threadID, messageID);
    }

    // ✅ Send the SMS
    const res = await axios.get("https://freemessagetext.vercel.app/api/send", {
      params: {
        number,
        text: message,
        "cf-turnstile-token": token
      }
    });

    const result = res.data;

    if (result.success && result.response?.success == 1) {
      api.sendMessage(`✅ Message sent to ${number}!\n📩 ${result.response.message}`, threadID, messageID);
    } else {
      api.sendMessage(`❌ Failed:\n${JSON.stringify(result, null, 2)}`, threadID, messageID);
    }

  } catch (err) {
    console.error("❌ CAPTCHA ERROR:", err);
    api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};
