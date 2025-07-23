const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "noti",
  version: "1.1.1",
  role: 1,
  description: "Sends a message to all groups and can only be done by the admin.",
  hasPrefix: false,
  aliases: ["noti"],
  usages: "[Text]",
  cooldown: 0,
};

module.exports.run = async function ({ api, event, args }) {
  if (!args[0]) {
    return api.sendMessage("❌ Please provide the message to broadcast.", event.threadID);
  }

  const messageText = args.join(" ");
  const threadList = await api.getThreadList(100, null, ["INBOX"]);
  let sentCount = 0;

  async function sendMessage(thread) {
    try {
      const finalMessage = 
`🔔 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 𝐍𝐎𝐓𝐈𝐂𝐄
━━━━━━━━━━━━
👤 𝐁𝐨𝐭 𝐀𝐝𝐦𝐢𝐧: 𝐇𝐎𝐌𝐄𝐑 𝐑𝐄𝐁𝐀𝐓𝐈𝐒
📌 ${messageText}
━━━━━━━━━━━━`;

      await api.sendMessage(finalMessage, thread.threadID);

      const language = "tl"; // Filipino
      const audioPath = path.resolve(__dirname, "cache", `${thread.threadID}_female.mp3`);

      await downloadFile(
        `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(messageText)}&tl=${language}&client=tw-ob&idx=1`,
        audioPath
      );

      await api.sendMessage(
        { attachment: fs.createReadStream(audioPath) },
        thread.threadID,
        () => fs.unlinkSync(audioPath)
      );

      sentCount++;
    } catch (err) {
      console.error(`[NOTI] Failed to send to thread ${thread.threadID}:`, err.message);
    }
  }

  for (const thread of threadList) {
    if (sentCount >= 20) break;
    if (thread.isGroup && thread.threadID !== event.threadID) {
      await sendMessage(thread);
    }
  }

  if (sentCount > 0) {
    api.sendMessage(`✅ Successfully sent to ${sentCount} group(s).`, event.threadID);
  } else {
    api.sendMessage(`⚠️ No eligible group threads found.`, event.threadID);
  }
};

async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
         }
