const axios = require("axios");

const cooldowns = {}; // Stores cooldowns per senderID
const activeShares = {}; // Tracks ongoing share tasks per senderID
const COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 1 day
const MAX_SHARE_AMOUNT = 20; // maximum shares per session

module.exports.config = {
  name: "fbshare",
  version: "1.2.0",
  role: 0,
  credits: "Homer RebatisT",
  description: "Share a Facebook post using your cookie (private messages only, cancelable)",
  usages: "fbshare cookie | postLink | amount",
  cooldowns: 5,
  hasPrefix: true
};

module.exports.run = async ({ api, event, args }) => {
  const { senderID, threadID, messageID } = event;

  // Private messages only
  if (String(threadID).startsWith("-")) {
    return api.sendMessage(
      "🚫 This command is available only in private messages.",
      threadID,
      messageID
    );
  }

  // Cancel ongoing share
  if (args[0]?.toLowerCase() === "cancel") {
    if (activeShares[senderID]) {
      activeShares[senderID].cancelled = true;
      return api.sendMessage("🛑 Ongoing share cancelled.", threadID, messageID);
    } else {
      return api.sendMessage("⚠️ No active share to cancel.", threadID, messageID);
    }
  }

  // Cooldown check
  if (cooldowns[senderID]) {
    const remainingTime = COOLDOWN_DURATION - (Date.now() - cooldowns[senderID]);
    if (remainingTime > 0) {
      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      return api.sendMessage(
        `⏳ Please wait ${hours}h ${minutes}m ${seconds}s before using "fbshare" again.`,
        threadID,
        messageID
      );
    }
  }

  try {
    const input = args.join(" ").split("|").map(item => item.trim());

    if (input.length < 3) {
      return api.sendMessage(
        "❌ Incorrect usage.\nExample:\nfbshare your_cookie_here | post_link | 5",
        threadID,
        messageID
      );
    }

    const [cookie, postLink, amountRaw] = input;
    let amount = parseInt(amountRaw);

    if (!postLink.startsWith("https://")) {
      return api.sendMessage("❌ Invalid post link. It must start with https://", threadID, messageID);
    }

    if (isNaN(amount) || amount <= 0) {
      return api.sendMessage("❌ Share amount must be a positive number.", threadID, messageID);
    }

    if (amount > MAX_SHARE_AMOUNT) {
      amount = MAX_SHARE_AMOUNT;
    }

    const headers = {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      cookie
    };

    // Get EAAG token
    const tokenRes = await axios.get("https://business.facebook.com/content_management", {
      headers,
      timeout: 20000
    });

    const tokenMatch = tokenRes.data.match(/EAAG\w+/);
    if (!tokenMatch) {
      return api.sendMessage("❌ Failed to extract token. Your cookie may be invalid or expired.", threadID, messageID);
    }

    const fbtoken = tokenMatch[0];
    let success = 0;
    let fail = 0;

    // Track active share
    activeShares[senderID] = { cancelled: false };

    api.sendMessage(`⏳ Starting to share ${amount} times... You can type "fbshare cancel" to stop.`, threadID, messageID);

    for (let i = 1; i <= amount; i++) {
      if (activeShares[senderID].cancelled) break;

      try {
        // Random delay 1–5 seconds
        const delay = Math.floor(Math.random() * 5000) + 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        const shareRes = await axios.post(
          `https://b-graph.facebook.com/me/feed?link=${encodeURIComponent(postLink)}&published=0&access_token=${fbtoken}`,
          {},
          { headers, timeout: 15000 }
        );

        if (shareRes.data && shareRes.data.id) success++;
        else fail++;
      } catch {
        fail++;
      }
    }

    delete activeShares[senderID]; // clear after finishing

    // Set cooldown
    cooldowns[senderID] = Date.now();

    return api.sendMessage(
      `✅ Sharing completed!\nTotal attempted: ${amount}\nSuccess: ${success}\nFailed: ${fail}`,
      threadID,
      messageID
    );

  } catch (err) {
    delete activeShares[senderID];
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};
