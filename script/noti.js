const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "sendnoti",
  version: "1.2.0",
  role: 1,
  description: "Sends a message with audio to all group threads (Admin only).",
  hasPrefix: false,
  aliases: ["noti"],
  usages: "[Text]",
  cooldown: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const messageText = args.join(" ").trim();
  if (!messageText) return api.sendMessage("⚠️ Please provide a message.", event.threadID);

  const MAX_SEND = 20;
  const languageCode = "tl";
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);

  const header = "𝙉𝙊𝙏𝙄𝘾𝙀 𝙁𝙍𝙊𝙈 𝘿𝙀𝙑𝙀𝙇𝙊𝙋𝙀𝙍\n----------------\nDeveloper: HOMER REBATIS\n----------------";
  const fullMessage = `${header}\n『𝗡𝗼𝘁𝗶𝗰𝗲』${messageText}`;

  let sentCount = 0;

  const threadList = await api.getThreadList(100, null, ["INBOX"]);

  for (const thread of threadList) {
    if (sentCount >= MAX_SEND) break;
    if (!thread.isGroup || thread.threadID === event.threadID) continue;

    const audioPath = path.join(cacheDir, `${thread.threadID}_noti.mp3`);
    try {
      // Send message text
      await api.sendMessage(fullMessage, thread.threadID);
      sentCount++;

      // Download TTS audio
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(messageText)}&tl=${languageCode}&client=tw-ob&idx=1`;

      await downloadFile(ttsUrl, audioPath);
      await api.sendMessage(
        { attachment: fs.createReadStream(audioPath) },
        thread.threadID,
        () => fs.remove(audioPath)
      );

      await delay(1000); // Delay to avoid being rate-limited
    } catch (err) {
      console.error(`❌ Error sending to thread ${thread.threadID}:`, err.message);
    }
  }

  const feedbackMsg = sentCount > 0
    ? `✅ Successfully sent the notification to ${sentCount} group(s).`
    : "⚠️ No eligible group threads found to send the message.";

  return api.sendMessage(feedbackMsg, event.threadID);
};

// Download file helper
async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
         }
