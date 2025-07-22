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
  try {
    const customMessage = args.join(" ");
    if (!customMessage) {
      return api.sendMessage("⚠️ Please provide a message to send.", event.threadID);
    }

    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    console.log(`✅ Retrieved ${threadList.length} threads.`);

    let sentCount = 0;

    for (const thread of threadList) {
      if (sentCount >= 20) break;
      if (!thread.isGroup || thread.threadID === event.threadID) continue;

      try {
        const message = `𝙉𝙊𝙏𝙄𝘾𝙀 𝙁𝙍𝙊𝙈 𝘿𝙀𝙑𝙀𝙇𝙊𝙋𝙀𝙍 
---------------- 
Developer : HOMER REBATIS
--------------- 
『𝗡𝗼𝘁𝗶𝗰𝗲』${customMessage}`;

        await api.sendMessage(message, thread.threadID);
        console.log(`✅ Message sent to: ${thread.threadID}`);
        sentCount++;

        /*
        // Optional: TTS (Text-to-Speech)
        const ttsPath = path.resolve(__dirname, "cache", `${thread.threadID}_female.mp3`);
        await fs.ensureDir(path.dirname(ttsPath));

        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(customMessage)}&tl=tl&client=tw-ob`;

        await downloadFile(ttsUrl, ttsPath);

        await api.sendMessage(
          { attachment: fs.createReadStream(ttsPath) },
          thread.threadID,
          () => fs.unlink(ttsPath)
        );
        */

      } catch (err) {
        console.error(`❌ Error sending to thread ${thread.threadID}:`, err);
      }
    }

    if (sentCount > 0) {
      api.sendMessage(`✅ Notification sent to ${sentCount} group(s).`, event.threadID);
    } else {
      api.sendMessage("⚠️ No eligible group threads found to send the message.", event.threadID);
    }

  } catch (err) {
    console.error("❌ Main error in noti module:", err);
    api.sendMessage("⚠️ An error occurred while sending the notifications.", event.threadID);
  }
};

// Helper: Download file (stream)
async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
    }
