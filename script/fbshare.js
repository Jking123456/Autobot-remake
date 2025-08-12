const axios = require("axios");

const cooldowns = {}; // Stores cooldowns per (threadID + senderID)
const COOLDOWN_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

module.exports.config = {
  name: "fbshare",
  version: "1.0.4",
  role: 0,
  credits: "Homer RebatisT",
  description: "Share a Facebook post using your cookie with share amount",
  usages: "fbshare cookie | postLink | amount",
  cooldowns: 5,
  hasPrefix: true
};

module.exports.run = async ({ api, event, args }) => {
  const { senderID, threadID, messageID } = event;
  const cooldownKey = `${threadID}_${senderID}`;

  // ✅ Restrict to group admin only
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.",
          threadID,
          messageID
        );
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage(
      "⚠️ Couldn't verify bot permissions. Try again later.",
      threadID,
      messageID
    );
  }

  // Cooldown check (per thread + sender)
  if (cooldowns[cooldownKey]) {
    const remainingTime = COOLDOWN_DURATION - (Date.now() - cooldowns[cooldownKey]);

    if (remainingTime > 0) {
      const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      let timeMsg = [];
      if (days) timeMsg.push(`${days} day(s)`);
      if (hours) timeMsg.push(`${hours} hour(s)`);
      if (minutes) timeMsg.push(`${minutes} minute(s)`);
      if (seconds) timeMsg.push(`${seconds} second(s)`);

      return api.sendMessage(
        `⏳ Please wait ${timeMsg.join(", ")} before using the "fbshare" command again.`,
        threadID,
        messageID
      );
    }
  }

  try {
    const input = args.join(" ").split("|").map(item => item.trim());

    if (input.length < 3) {
      return api.sendMessage(
        "❌ Incorrect usage.\n\nExample:\nfbshare your_cookie_here | post_link | 100",
        threadID,
        messageID
      );
    }

    const [cookie, postLink, amountRaw] = input;
    const amount = parseInt(amountRaw);

    if (!postLink.startsWith("https://")) {
      return api.sendMessage("❌ Invalid post link. It must start with https://", threadID, messageID);
    }

    if (isNaN(amount) || amount <= 0 || amount > 50000) {
      return api.sendMessage("❌ Share amount must be a number between 1 and 50,000.", threadID, messageID);
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
      return api.sendMessage("❌ Failed to extract token. Your cookie may be invalid or expired.", threadID, messageID);
    }

    const fbtoken = tokenMatch[0];

    let success = 0;
    let fail = 0;

    api.sendMessage(`⏳ Starting to share ${amount} times... Please wait.`, threadID);

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

      if (i % 1000 === 0) {
        api.sendMessage(`📢 Progress: ${i}/${amount}\n✅ Success: ${success} | ❌ Failed: ${fail}`, threadID);
      }
    }

    // Set cooldown after execution
    cooldowns[cooldownKey] = Date.now();

    return api.sendMessage(
      `✅ Sharing complete!\nTotal: ${amount}\nSuccess: ${success}\nFailed: ${fail}`,
      threadID,
      messageID
    );

  } catch (err) {
    return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
  }
};
