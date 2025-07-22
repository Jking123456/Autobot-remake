const axios = require("axios");

const cooldowns = new Map();

module.exports.config = {
  name: "lyrics",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis + ChatGPT",
  description: "Get lyrics of a song by title.",
  commandCategory: "music",
  usages: "lyrics [song title]",
  cooldowns: 60,
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID, threadID, messageID } = event;
  const cooldownKey = `${senderID}_${threadID}`;
  const now = Date.now();

  // ✅ Check if bot is admin (in group only)
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
    return api.sendMessage("⚠️ Failed to verify bot permissions. Try again later.", threadID, messageID);
  }

  // ⏳ Cooldown check
  if (cooldowns.has(cooldownKey)) {
    const lastUsed = cooldowns.get(cooldownKey);
    const timePassed = (now - lastUsed) / 1000;
    const remaining = 60 - timePassed;

    if (remaining > 0) {
      return api.sendMessage(
        `⏳ Please wait ${Math.ceil(remaining)} seconds before using the "lyrics" command again.`,
        threadID,
        messageID
      );
    }
  }

  // Set new cooldown
  cooldowns.set(cooldownKey, now);
  setTimeout(() => cooldowns.delete(cooldownKey), 60 * 1000); // 1 minute

  const title = args.join(" ");
  if (!title) {
    return api.sendMessage("❗ Please provide a song title.\n\nUsage: lyrics [song title]", threadID, messageID);
  }

  try {
    const res = await axios.get(`https://betadash-api-swordslush.vercel.app/lyrics-finder?title=${encodeURIComponent(title)}`);
    const data = res.data;

    if (res.status !== 200 || data.status !== 200 || !data.response) {
      return api.sendMessage("❌ Couldn't find lyrics for that song. Try another one.", threadID, messageID);
    }

    const { Title, Thumbnail, response, author } = data;

    const message =
`🎶 Lyrics Found!

📌 Title: ${Title}
👤 Author: ${author}

${response}`;

    const image = await axios.get(Thumbnail, { responseType: "stream" });

    return api.sendMessage({
      body: message,
      attachment: image.data
    }, threadID, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("⚠️ Error fetching lyrics. Try again later.", threadID, messageID);
  }
};
