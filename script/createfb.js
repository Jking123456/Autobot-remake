const axios = require('axios');

module.exports.config = {
  name: "generateaccount", // Neutral, stealthy name
  role: 0,
  credits: "Neth (Fixed by Homer Rebatis)",
  description: "Generate a Facebook account via API",
  hasPrefix: true,
  cooldown: 10 * 60 * 1000, // 10 minutes
  usages: "{p}generateaccount",
  aliases: ["genacc", "createaccount"]
};

const userCooldowns = new Map(); // Track per-user cooldown

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // Check per-user cooldown
  const lastUsed = userCooldowns.get(senderID) || 0;
  const now = Date.now();
  if (now - lastUsed < 10 * 60 * 1000) {
    return api.sendMessage("⏳ Please wait before generating another account.", threadID, messageID);
  }
  userCooldowns.set(senderID, now);

  // Check thread type
  try {
    const threadInfo = await api.getThreadInfo(threadID);

    if (threadInfo.isGroup || threadInfo.isE2EE) {
      return api.sendMessage(
        "🚫 This command is available only in private messages and cannot be used in End-to-End Encrypted chats for safety.",
        threadID,
        messageID
      );
    }

  } catch (err) {
    console.error("Thread check failed:", err);
  }

  api.sendMessage("✨ Generating your Facebook account... Please wait...", threadID, messageID);

  try {
    const res = await axios.get('https://haji-mix.up.railway.app/api/fbcreate?amount=1');
    const result = res.data;

    if (!result.success || !Array.isArray(result.data) || result.data.length === 0 || !result.data[0].success) {
      throw new Error("API returned invalid response");
    }

    const acc = result.data[0].account;
    const genderStr = acc.gender === "M" ? "Male" : acc.gender === "F" ? "Female" : "Unknown";
    const verifiedStr = acc.verified ? "✅ Verified" : "❌ Not Verified";

    // Send minimal info to PM
    const message = `✨ Facebook Account ✨\n\n` +
      `📧 Email: ${acc.email}\n🔐 Password: ${acc.password}\n` +
      `🧍 Name: ${acc.name}\n🎂 Birthday: ${acc.birthday}\n` +
      `🚻 Gender: ${genderStr}\n🔒 Verified: ${verifiedStr}`;

    api.sendMessage(message, threadID, messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage("⚠️ Could not generate account. Please try again later.", threadID, messageID);
  }
};
