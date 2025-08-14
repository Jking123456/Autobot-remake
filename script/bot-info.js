const moment = require("moment-timezone");

const cooldowns = new Map(); // Per-user cooldown tracker

module.exports.config = {
  name: "bot-info",
  version: "1.2.0",
  aliases: ["info", "in", "fo"],
  role: 0,
  credits: "cliff",
  description: "Admin and Bot info (text-only).",
  cooldown: 60, // 60 seconds per user
  hasPrefix: false,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // ===== Admin/group check =====
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "❌ This command can only be used in groups where the bot is an admin.",
          threadID,
          messageID
        );
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage(
      "⚠️ Couldn't verify bot permissions. Please try again later.",
      threadID,
      messageID
    );
  }

  // ===== Cooldown check =====
  const now = Date.now();
  const lastUsed = cooldowns.get(senderID);
  const cooldownTime = 60 * 1000; // 60 seconds

  if (lastUsed && now - lastUsed < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - lastUsed)) / 1000);
    return api.sendMessage(
      `⏳ Please wait ${timeLeft} seconds before using this command again.`,
      threadID,
      messageID
    );
  }
  cooldowns.set(senderID, now);

  // ===== Uptime calculation =====
  const uptimeSec = process.uptime();
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = Math.floor(uptimeSec % 60);
  const uptimeString = `${hours}h ${minutes}m ${seconds}s`;

  // ===== Bot info =====
  const prefix = "/";
  const CREATORLINK = "https://www.facebook.com/helloworld5463882";
  const BOTCREATOR = "𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂";
  const BOTNAME = "𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝗧";
  const FILESOWNER = "𝙷𝙾𝙼𝙴𝚁";
  const currentTime = moment.tz("Asia/Manila").format("『D/MM/YYYY』 【HH:mm:ss】");

  // ===== Send text-only bot info =====
  const messageBody = `➢ Admin and Bot Information

⁂ Bot Name: ${BOTNAME}
✧ Bot Admin: ${BOTCREATOR}
♛ Bot Admin Link: ${CREATORLINK}
❂ Bot Prefix: ${prefix}
✫ Files Owner: ${FILESOWNER}
➟ UPTIME: ${uptimeString}
✬ Today is: ${currentTime}

✫ Thanks for using the bot!`;

  try {
    await api.sendMessage(messageBody, threadID, messageID);
  } catch (err) {
    console.error("Error sending message:", err);
    api.sendMessage(
      "❌ Failed to send bot info. Please try again later.",
      threadID,
      messageID
    );
  }
};
