const axios = require("axios");

module.exports = {
  config: {
    name: "alluser",
    version: "1.0.0",
    author: "cliff (converted by ChatGPT)",
    countDown: 5,
    role: 0,
    shortDescription: "List all users in the group",
    longDescription: "Displays all users in the current group with their name, ID, and Facebook link.",
    category: "group",
    guide: "{pn}"
  },

  onStart: async function ({ api, event, usersData }) {
    const threadID = event.threadID;
    const participantIDs = event.participantIDs;
    let msg = "";
    let index = 1;

    for (const userID of participantIDs) {
      const name = await usersData.getName(userID);
      msg += `${index++}. ${name}\nUID: ${userID}\nFB: https://facebook.com/${userID}\n\n`;
    }

    api.sendMessage(`📋 All users in this group:\n\n${msg}`, threadID);
  }
};
