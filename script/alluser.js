module.exports.config = {
  name: "alluser",
  version: "1.1",
  role: 0,
  hasPrefix: true,
  aliases: ["listuser", "groupusers", "members"],
  description: "List all users in the current group chat.",
  usage: "",
  credits: "Homer Rebatis",
  cooldowns: 5,
  commandCategory: "group"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs || [];
    const userInfoList = threadInfo.userInfo || [];

    if (participantIDs.length === 0) {
      return api.sendMessage("❌ No participants found in this group.", threadID, messageID);
    }

    // Fetch names from getUserInfo
    const usersInfo = await api.getUserInfo(participantIDs);

    // Create a quick lookup map from threadInfo.userInfo
    const fallbackNames = {};
    for (const user of userInfoList) {
      if (user.id && user.name) {
        fallbackNames[user.id] = user.name;
      }
    }

    let msg = "";
    let index = 1;
    const msgChunks = [];

    for (const userID of participantIDs) {
      let name = "Unknown User";

      if (usersInfo[userID]?.name) {
        name = usersInfo[userID].name;
      } else if (fallbackNames[userID]) {
        name = fallbackNames[userID];
      }

      const line = `${index++}. ${name}\nUID: ${userID}\nFB: https://facebook.com/${userID}\n\n`;

      if ((msg + line).length > 18000) {
        msgChunks.push(msg);
        msg = "";
      }

      msg += line;
    }

    if (msg.length > 0) {
      msgChunks.push(msg);
    }

    for (const chunk of msgChunks) {
      await api.sendMessage(`📋 All users in this group:\n\n${chunk}`, threadID);
    }

  } catch (err) {
    console.error("alluser.js error:", err);
    api.sendMessage("❌ Failed to fetch group users. Please try again later.", threadID, messageID);
  }
};
