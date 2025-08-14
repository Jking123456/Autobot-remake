const moment = require("moment-timezone");

const COMMAND_LIMIT = 5; // Max uses before restriction
const TIME_WINDOW = 10; // Seconds to count command usage
const RESTRICTION_DURATION = 15 * 60 * 1000; // 15 minutes in ms

module.exports.config = {
  name: "spamban",
  version: "3.0.0",
  hasPermission: 0,
  credits: "NTKhang (Fixed by Homer Rebatis)",
  description: `Temporarily restrict users from overusing commands. Usage limit: ${COMMAND_LIMIT} per ${TIME_WINDOW} seconds`,
  commandCategory: "System",
  usages: "spamban",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  return api.sendMessage(
    `⚠️ Users who use a command more than ${COMMAND_LIMIT} times within ${TIME_WINDOW} seconds will be temporarily restricted for ${RESTRICTION_DURATION / 60000} minutes.`,
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

  // Check if command is under restriction
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

  // Track command usage
  if (!userCommands[commandName]) {
    userCommands[commandName] = { number: 1, timeStart: Date.now() };
  } else {
    const now = Date.now();
    if (now - userCommands[commandName].timeStart <= TIME_WINDOW * 1000) {
      userCommands[commandName].number += 1;
    } else {
      userCommands[commandName].number = 1;
      userCommands[commandName].timeStart = now;
    }

    // Restrict if usage exceeds limit
    if (userCommands[commandName].number > COMMAND_LIMIT) {
      userCommands[commandName].restricted = true;
      userCommands[commandName].restrictedTime = Date.now();
      return api.sendMessage(
        `🚫 You have used the '${commandName}' command too many times. You are restricted from using it for ${RESTRICTION_DURATION / 60000} minutes.`,
        threadID
      );
    }
  }
};
