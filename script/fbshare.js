const axios = require("axios");

module.exports.config = {
  name: "fbshare",
  version: "1.0.3",
  role: 0,
  credits: "Homer Rebatis",
  description: "Share a Facebook post using your cookie with share amount",
  usages: "fbshare cookie | postLink | amount",
  cooldowns: 5,
  hasPrefix: true
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const input = args.join(" ").split("|").map(item => item.trim());

    if (input.length < 3) {
      return api.sendMessage(
        "❌ Incorrect usage.\n\nExample:\nfbshare your_cookie_here | post_link | 100",
        event.threadID,
        event.messageID
      );
    }

    const [cookie, postLink, amountRaw] = input;
    const amount = parseInt(amountRaw);

    if (!postLink.startsWith("https://")) {
      return api.sendMessage("❌ Invalid post link. It must start with https://", event.threadID, event.messageID);
    }

    if (isNaN(amount) || amount <= 0 || amount > 50000) {
      return api.sendMessage("❌ Share amount must be a number between 1 and 50,000.", event.threadID, event.messageID);
    }

    const headers = {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "cookie": cookie
    };

    // Get EAAG token
    const tokenRes = await axios.get("https://business.facebook.com/content_management", {
      headers,
      timeout: 20000
    });

    const tokenMatch = tokenRes.data.match(/EAAG\w+/);
    if (!tokenMatch) {
      return api.sendMessage("❌ Failed to extract token. Your cookie may be invalid or expired.", event.threadID, event.messageID);
    }

    const fbtoken = tokenMatch[0];

    let success = 0;
    let fail = 0;

    api.sendMessage(`⏳ Starting to share ${amount} times... Please wait.`, event.threadID);

    for (let i = 1; i <= amount; i++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
        const shareRes = await axios.post(
          `https://b-graph.facebook.com/me/feed?link=${encodeURIComponent(postLink)}&published=0&access_token=${fbtoken}`,
          {},
          { headers, timeout: 15000 }
        );

        if (shareRes.data && shareRes.data.id) {
          success++;
        } else {
          fail++;
        }
      } catch (err) {
        fail++;
      }

      // Optional: Send progress every 1000 shares
      if (i % 1000 === 0) {
        api.sendMessage(`📢 Progress: ${i}/${amount}\n✅ Success: ${success} | ❌ Failed: ${fail}`, event.threadID);
      }
    }

    return api.sendMessage(
      `✅ Sharing complete!\nTotal: ${amount}\nSuccess: ${success}\nFailed: ${fail}`,
      event.threadID,
      event.messageID
    );

  } catch (err) {
    return api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
  }
};
