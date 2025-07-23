const axios = require('axios');

module.exports.config = {
  name: "alluser",
  version: "1.1.0",
  role: 0,
  credits: "Homer Rebatis",
  aliases: [],
  usages: "",
  cooldown: 5,
  description: "List all users in the current group with name, UID, and FB link"
};

module.exports.run = async ({ api, event, Users }) => {
  const { threadID, messageID } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs || [];

    if (participantIDs.length === 0) {
      return api.sendMessage("❌ No participants found in this group.", threadID, messageID);
    }

    let msg = "";
    let index = 1;
    const msgChunks = [];

    for (const userID of participantIDs) {
      let name;
      try {
        name = await Users.getName(userID);
      } catch {
        name = "Unknown User";
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
