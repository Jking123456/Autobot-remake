const moment = require("moment-timezone");

const COMMAND_LIMIT = 5; // Max uses before restriction
const RESTRICTION_DURATION = 15 * 60 * 1000; // 15 minutes in ms

module.exports.config = {
  name: "spamban",
  version: "3.1.0",
  hasPermission: 0,
  credits: "NTKhang (Modified by Homer Rebatis)",
  description: `Temporarily restrict users from overusing commands. Limit: ${COMMAND_LIMIT} times, restriction: ${RESTRICTION_DURATION / 60000} minutes`,
  commandCategory: "System",
  usages: "spamban",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  return api.sendMessage(
    `⚠️ Users who use a command more than ${COMMAND_LIMIT} times will be temporarily restricted for ${RESTRICTION_DURATION / 60000} minutes.`,
    event.threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function({ Users, Threads, api, event }) {
  const { senderID, threadID, body } = event;
  if (!body) return;

  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (!body.startsWith(prefix)) return;

  const commandName = body.slice(prefix.length).split(" ")[0];

  if (!global.client.commandTracker) global.client.commandTracker = {};
  if (!global.client.commandTracker[senderID]) global.client.commandTracker[senderID] = {};

  const userCommands = global.client.commandTracker[senderID];

  // If restricted
  if (userCommands[commandName] && userCommands[commandName].restricted) {
    const now = Date.now();
    if (now - userCommands[commandName].restrictedTime >= RESTRICTION_DURATION) {
      // Lift restriction
      userCommands[commandName] = { number: 0 };
    } else {
      const remaining = Math.ceil((RESTRICTION_DURATION - (now - userCommands[commandName].restrictedTime)) / 60000);
      return api.sendMessage(`🚫 You are temporarily restricted from using '${commandName}' command. Try again in ${remaining} minute(s).`, threadID);
    }
  }

  // Track usage
  if (!userCommands[commandName]) {
    userCommands[commandName] = { number: 1 };
  } else {
    userCommands[commandName].number += 1;

    if (userCommands[commandName].number >= COMMAND_LIMIT) {
      userCommands[commandName].restricted = true;
      userCommands[commandName].restrictedTime = Date.now();
      return api.sendMessage(
        `🚫 You have used the '${commandName}' command ${COMMAND_LIMIT} times. You are restricted from using it for ${RESTRICTION_DURATION / 60000} minutes.`,
        threadID
      );
    }
  }
};
