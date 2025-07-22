const axios = require('axios');

module.exports.config = {
  name: "createfb",
  role: 0,
  credits: "Neth (Fixed by ChatGPT)",
  description: "Create a Facebook account via API",
  hasPrefix: true,
  cooldown: 10 * 60 * 1000, // 10 minutes
  usages: "{p}createfb",
  aliases: ["fbaccount", "createfb"]
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  // ✅ Admin check for group chats
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("❌ This command can only be used in groups where the bot is an admin.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Could not verify bot permissions. Please try again later.", threadID, messageID);
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);
  api.sendMessage(`Creating & Generating Facebook Account...\n⏳ Please wait...`, threadID, messageID);

  try {
    const res = await axios.get(`https://haji-mix.up.railway.app/api/fbcreate?amount=1`);
    const result = res.data;

    if (!result.success || !Array.isArray(result.data) || result.data.length === 0 || !result.data[0].success) {
      throw new Error("Invalid or failed response from API");
    }

    const acc = result.data[0].account;

    const {
      email,
      password,
      name,
      birthday,
      gender,
      token,
      id,
      verified
    } = acc;

    const genderStr = gender === "M" ? "Male" : gender === "F" ? "Female" : "Unknown";
    const verifiedStr = verified ? "✅ Verified" : "❌ Not Verified";

    const message = `✨ Facebook Account ✨\n\n` +
      `📧 Email: ${email}\n🔐 Password: ${password}\n` +
      `🧍 Name: ${name}\n🎂 Birthday: ${birthday}\n` +
      `🆔 ID: ${id}\n🚻 Gender: ${genderStr}\n` +
      `🔑 Token: ${token}\n🔒 Verified: ${verifiedStr}`;

    api.setMessageReaction("✅", messageID, () => {}, true);
    api.sendMessage(message, threadID, messageID);

  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("❗ An error occurred while creating the account. Please try again later.", threadID, messageID);
  }
};
