const fs = require("fs");
const moment = require("moment-timezone");
const request = require("request");

module.exports.config = {
  name: "bot",
  version: "1.0.1",
  aliases: ["info", "Info", "in", "fo"],
  role: 0,
  credits: "cliff",
  description: "Admin and Bot info.",
  cooldown: 5,
  hasPrefix: false,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // ✅ Admin restriction for group chats
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
    return api.sendMessage("⚠️ Couldn't verify bot permissions. Please try again later.", threadID, messageID);
  }

  let time = process.uptime();
  let years = Math.floor(time / (60 * 60 * 24 * 365));
  let months = Math.floor((time % (60 * 60 * 24 * 365)) / (60 * 60 * 24 * 30));
  let days = Math.floor((time % (60 * 60 * 24 * 30)) / (60 * 60 * 24));
  let weeks = Math.floor(days / 7);
  let hours = Math.floor((time % (60 * 60 * 24)) / (60 * 60));
  let minutes = Math.floor((time % (60 * 60)) / 60);
  let seconds = Math.floor(time % 60);
  const uptimeString = `${years > 0 ? `${years} years ` : ''}${months > 0 ? `${months} months ` : ''}${weeks > 0 ? `${weeks} weeks ` : ''}${days % 7 > 0 ? `${days % 7} days ` : ''}${hours > 0 ? `${hours} hours ` : ''}${minutes > 0 ? `${minutes} minutes ` : ''}${seconds} seconds`;

  const prefix = "/";
  const CREATORLINK = "https://www.facebook.com/helloworld5463882";
  const BOTCREATOR = "𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂";
  const BOTNAME = "𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃";
  const FILESOWNER = "𝙷𝙾𝙼𝙴𝚁";
  const juswa = moment.tz("Asia/Manila").format("『D/MM/YYYY』 【HH:mm:ss】");
  const link = [ /* your video links */ ];

  const callback = () => {
    api.sendMessage({
      body: `➢ Admin and Bot Information

⁂ Bot Name: ${BOTNAME}
✧ Bot Admin: ${BOTCREATOR}
♛ Bot Admin Link: ${CREATORLINK}
❂ Bot Prefix: ${prefix}
✫ Files Owner: ${FILESOWNER}
➟ UPTIME ${uptimeString}
✬ Today is: ${juswa} 

➳ Bot is running ${hours}:${minutes}:${seconds}.
✫ Thanks for using my bot`,
      attachment: fs.createReadStream(__dirname + "/cache/owner_video.mp4")
    }, threadID, () => fs.unlinkSync(__dirname + "/cache/owner_video.mp4"));
  };

  const linkIndex = Math.floor(Math.random() * link.length);
  request(encodeURI(link[linkIndex]))
    .on('error', (err) => {
      console.error('Error downloading video:', err);
      api.sendMessage('An error occurred while processing the command.', threadID, null, messageID);
    })
    .pipe(fs.createWriteStream(__dirname + "/cache/owner_video.mp4"))
    .on("close", callback);
};
