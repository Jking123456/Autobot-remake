const axios = require("axios");
const fs = require("fs-extra");

const cooldowns = new Map();

module.exports.config = {
  name: "shoti",
  version: "1.0.2",
  role: 0,
  credits: "Homer Rebatis",
  aliases: ["tiktokshoti", "shorts"],
  usages: "",
  cooldown: 2,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID, senderID } = event;
  const filePath = __dirname + `/cache/shoti-${Date.now()}.mp4`;

  // ✅ Restrict to bot-admin only in groups
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 Bot must be an admin to use the 'shoti' command in this group.",
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

  // ⏳ Cooldown (30s per user)
  const now = Date.now();
  if (cooldowns.has(senderID)) {
    const elapsed = now - cooldowns.get(senderID);
    if (elapsed < 30 * 1000) {
      const waitTime = Math.ceil((30 * 1000 - elapsed) / 1000);
      return api.sendMessage(
        `⏳ Please wait ${waitTime} seconds before using "shoti" again.`,
        threadID,
        messageID
      );
    }
  }

  try {
    cooldowns.set(senderID, now);
    api.sendMessage("📺 Fetching a random Shoti video, please wait...", threadID, messageID);

    const apiUrl = `https://kaiz-apis.gleeze.com/api/shoti?apikey=63fafad1-e326-432c-85f6-54b505835e72`;
    const res = await axios.get(apiUrl);

    if (res.data.status !== "success" || !res.data.shoti?.videoUrl) {
      return api.sendMessage("❌ Failed to fetch Shoti video. Try again later.", threadID, messageID);
    }

    const { username, nickname, region, duration, videoUrl } = res.data.shoti;

    // Download video
    const videoBuffer = (await axios.get(videoUrl, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(filePath, Buffer.from(videoBuffer));

    api.sendMessage({
      body: `🎬 Shoti by @${username} (${nickname})\n🌍 Region: ${region}\n⏱ Duration: ${duration}s`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error fetching Shoti: ${error.message}`, threadID, messageID);
  }
};
