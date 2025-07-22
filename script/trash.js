const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "trash",
  version: "1.0.0",
  role: 0,
  credits: "ChatGPT",
  aliases: [],
  usages: "< Facebook UID >",
  cooldown: 2,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const uid = args[0];
  const filePath = __dirname + `/cache/trash.png`;

  // ✅ Restrict if bot is not an admin in group chats
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command can only be used if the bot is an admin in this group.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("❗ Admin check error:", err);
    return api.sendMessage("⚠️ Failed to verify admin status. Please try again later.", threadID, messageID);
  }

  if (!uid || isNaN(uid)) {
    return api.sendMessage("❌ Please provide a valid Facebook UID.\n\nExample: trash 100044848836284", threadID, messageID);
  }

  try {
    api.sendMessage("🗑️ Generating trash edit, please wait...", threadID, messageID);

    const imageUrl = `https://api-canvass.vercel.app/trash?userid=${uid}`;
    const imageBuffer = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;

    fs.writeFileSync(filePath, Buffer.from(imageBuffer, "utf-8"));

    api.sendMessage({
      body: `🗑️ Trash result for UID: ${uid}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => fs.unlinkSync(filePath), messageID);

  } catch (error) {
    console.error(error);
    api.sendMessage(`❌ Error fetching image: ${error.message}`, threadID, messageID);
  }
};
