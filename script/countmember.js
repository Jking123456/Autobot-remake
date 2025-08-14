const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "countmember",
  version: "1.0.1",
  role: 0,
  hasPrefix: false,
  description: "Count all members in the group chat (human-like delay)",
  usages: "countmember",
  credits: "Homer Rebatis",
  cooldowns: 5 // Adds a short cooldown to avoid rapid reuse
};

module.exports.run = async function({ api, event }) {
  try {
    // Add a random delay to mimic human typing
    const delay = Math.floor(Math.random() * 1500) + 1000; // 1-2.5 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    const threadInfo = await api.getThreadInfo(event.threadID);
    const memberCount = threadInfo.participantIDs.length;

    // Slightly vary the message to look less automated
    const messages = [
      `There are ${memberCount} members in this group.`,
      `Total members here: ${memberCount}.`,
      `Looks like ${memberCount} people are in this chat.`
    ];
    const messageToSend = messages[Math.floor(Math.random() * messages.length)];

    await api.sendMessage(messageToSend, event.threadID);
  } catch (error) {
    await api.sendMessage(`Oops! Something went wrong: ${error.message}`, event.threadID, event.messageID);
  }
};
