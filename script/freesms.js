const puppeteer = require("puppeteer");
const axios = require("axios");

module.exports.config = {
  name: "freesms",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis + ChatGPT",
  description: "Send free SMS via freemessagetext.vercel.app",
  commandCategory: "tools",
  usages: "freesms 09xxxxxxxxx | your message",
  cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
  const input = args.join(" ").split("|").map(item => item.trim());

  if (input.length < 2) {
    return api.sendMessage(
      "❗ Usage:\nfreesms 09xxxxxxxxx | your message",
      event.threadID,
      event.messageID
    );
  }

  const rawNumber = input[0];
  const messageText = input.slice(1).join(" ");

  if (!/^09\d{9}$/.test(rawNumber)) {
    return api.sendMessage("❌ Invalid PH number. Use format: 09xxxxxxxxx", event.threadID, event.messageID);
  }

  const formattedNumber = rawNumber.replace(/^0/, "+63");

  try {
    const token = await getTurnstileToken();

    if (!token) {
      return api.sendMessage("❌ Failed to retrieve Turnstile token.", event.threadID, event.messageID);
    }

    const response = await axios.get("https://freemessagetext.vercel.app/api/send", {
      params: {
        number: formattedNumber,
        text: messageText,
        "cf-turnstile-token": token
      }
    });

    if (response.data?.success) {
      return api.sendMessage(
        `✅ SMS sent to ${formattedNumber}\n📩 Status: ${response.data.message || "Success"}`,
        event.threadID,
        event.messageID
      );
    } else {
      return api.sendMessage(
        `⚠️ Failed to send SMS:\n${response.data?.message || "Unknown error"}`,
        event.threadID,
        event.messageID
      );
    }

  } catch (error) {
    console.error("❌ SMS Error:", error);
    return api.sendMessage(
      `❌ Error sending SMS:\n${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};

// ✅ Uses full puppeteer (Chromium auto-installed)
async function getTurnstileToken() {
  const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

  const page = await browser.newPage();
  let token = null;

  await page.exposeFunction("onTokenReady", (receivedToken) => {
    token = receivedToken;
  });

  await page.goto("https://freemessagetext.vercel.app", { waitUntil: "networkidle2" });

  await page.evaluate(() => {
    const renderCaptcha = () => {
      if (window.turnstile && document.querySelector("#captcha")) {
        try {
          turnstile.render('#captcha', {
            sitekey: document.querySelector('[data-sitekey]')?.getAttribute("data-sitekey") || '',
            callback: (token) => {
              window.onTokenReady(token);
              window.turnstileToken = token;
            }
          });
        } catch (e) {}
      }
    };
    setTimeout(renderCaptcha, 1000);
  });

  try {
    await page.waitForFunction(() => window.turnstileToken !== undefined, { timeout: 15000 });
  } catch {
    await browser.close();
    return null;
  }

  await browser.close();
  return token;
}
