const axios = require("axios");

module.exports = {
  config: {
    name: "alluser",
    version: "1.1.0",
    author: "Homer Rebatis",
    countDown: 5,
    role: 0,
    shortDescription: "List all users in the group",
    longDescription: "Displays all users in the current group with their name, ID, and Facebook link.",
    category: "group",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    const threadID = event.threadID;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participantIDs = threadInfo.participantIDs;

      if (!participantIDs || participantIDs.length === 0) {
        return api.sendMessage("❌ No participants found in this group.", threadID);
      }

      let msgChunks = [];
      let msg = "";
      let index = 1;

      for (const userID of participantIDs) {
        let name = await usersData.getName(userID).catch(() => null);
        if (!name) name = "Unknown User";

        const line = `${index++}. ${name}\nUID: ${userID}\nFB: https://facebook.com/${userID}\n\n`;

        // Prevent exceeding message limit
        if ((msg + line).length > 19000) {
          msgChunks.push(msg);
          msg = "";
        }
        msg += line;
      }

      msgChunks.push(msg); // Push the last chunk

      for (const chunk of msgChunks) {
        await api.sendMessage(`📋 All users in this group:\n\n${chunk}`, threadID);
      }
    } catch (err) {
      console.error("alluser error:", err);
      api.sendMessage("❌ Failed to fetch group users. Please try again later.", threadID);
    }
  }
};
