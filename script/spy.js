const axios = require("axios");

module.exports.config = {
  name: "spy",
  version: "2.0",
  role: 0,
  hasPrefix: true,
  aliases: ["whoishe", "whoisshe", "whoami", "stalk"],
  description: "View user profile and information",
  usage: "[reply/tag/uid]",
  credits: "xnil6x, fixed by ChatGPT",
  cooldowns: 5,
  commandCategory: "info"
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID, messageID, messageReply, mentions, threadID } = event;

  let uid =
    args[0]?.match(/^\d+$/)?.[0] ||
    args[0]?.match(/profile\.php\?id=(\d+)/)?.[1] ||
    Object.keys(mentions)[0] ||
    (messageReply && messageReply.senderID) ||
    senderID;

  try {
    const userInfo = await api.getUserInfo(uid);
    const info = userInfo[uid];

    if (!info) throw new Error("User info not found.");

    const genderMap = { 1: "♀️ Girl", 2: "♂️ Boy", undefined: "🌈 Custom" };

    const profileBox = `╭─── ✦ PROFILE ✦ ───
├─ 🎭 Name: ${info.name}
├─ 🧬 Gender: ${genderMap[info.gender] || "Unknown"}
├─ 🆔 UID: ${uid}
├─ 👑 Type: ${info.type?.toUpperCase() || "User"}
├─ 🏷️ Username: ${info.vanity || "None"}
├─ 🎂 Birthday: ${info.isBirthday ? "Yes" : "Private"}
├─ 💫 Nickname: ${info.alternateName || "None"}
├─ 🤖 Bot Friend: ${info.isFriend ? "✅ Yes" : "❌ No"}
╰────────────────`;

    const profileUrl = `🌐 Profile: ${info.profileUrl || "Unavailable"}`;
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;

    // ✅ Use axios directly to stream the image
    const response = await axios({
      url: avatarUrl,
      method: "GET",
      responseType: "stream"
    });

    return api.sendMessage(
      {
        body: `${profileBox}\n\n${profileUrl}`,
        attachment: response.data
      },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("SPY COMMAND ERROR:", err);
    return api.sendMessage(`❌ Couldn't spy on this user.\nReason: ${err.message}`, threadID, messageID);
  }
};
