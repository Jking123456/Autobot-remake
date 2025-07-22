const axios = require("axios");

module.exports.config = {
  name: "userinfo",
  version: "2.1",
  role: 0,
  hasPrefix: true,
  aliases: ["spy", "whoishe", "whoisshe", "whoami", "stalk"],
  description: "View user profile and information",
  usage: "[reply/tag/uid]",
  credits: "Homer Rebatis + ChatGPT",
  cooldowns: 5,
  commandCategory: "info"
};

module.exports.run = async function ({ api, event, args }) {
  const { senderID, messageID, messageReply, mentions, threadID } = event;

  // ✅ Restrict command usage in group chats if bot is not admin
  if (threadID != senderID) {
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();

      const isBotAdmin = threadInfo.adminIDs.some(item => item.id === botID);

      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 I need to be an admin in this group to run this command.",
          threadID,
          messageID
        );
      }
    } catch (e) {
      return api.sendMessage(
        "⚠️ Error checking bot's admin status.",
        threadID,
        messageID
      );
    }
  }

  // ✅ Get UID from args or reply/tag
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

    // ✅ Fixed: Correct profile URL formatting
    const profileUrl = `https://facebook.com/${info.vanity || uid}`;

    const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512`;

    const response = await axios({
      url: avatarUrl,
      method: "GET",
      responseType: "stream"
    });

    return api.sendMessage(
      {
        body: `${profileBox}\n\n🌐 View Profile:\n👉 ${profileUrl}`,
        attachment: response.data
      },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("USERINFO COMMAND ERROR:", err);
    return api.sendMessage(
      `❌ Couldn't get user info.\nReason: ${err.message}`,
      threadID,
      messageID
    );
  }
};
