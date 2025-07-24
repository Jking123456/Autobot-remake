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
    api.sendMessage("⏳ Solving CAPTCHA and sending SMS...", threadID, messageID);

    const browser = await puppeteer.launch({
      headless: "new", // more stable on Render
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto("https://freemessagetext.vercel.app/", { waitUntil: "networkidle2" });

    // ✅ Wait for Turnstile response token field
    await page.waitForSelector('textarea[name="cf-turnstile-response"]', { timeout: 15000 });

    // ✅ Extract token value directly
    const token = await page.$eval('textarea[name="cf-turnstile-response"]', el => el.value);

    if (!token) throw new Error("CAPTCHA token was not generated.");

    await browser.close();

    // 🔐 Use the token to call the API
    const res = await axios.get(`https://freemessagetext.vercel.app/api/send`, {
      params: {
        number: number,
        text: message,
        "cf-turnstile-token": token
      }
    });

    const result = res.data;

    if (result.success && result.response?.success == 1) {
      api.sendMessage(`✅ SMS sent to ${number}!\n📩 ${result.response.message}`, threadID, messageID);
    } else {
      api.sendMessage(`❌ Failed to send SMS:\n${JSON.stringify(result.response || result, null, 2)}`, threadID, messageID);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
  }
};
