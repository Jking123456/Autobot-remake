const COMMAND_LIMIT = 5;
const RESTRICTION_DURATION = 15 * 60 * 1000; // 15 minutes

module.exports.config = {
  name: "spamban",
  version: "3.1.1",
  hasPermission: 0,
  credits: "NTKhang (Modified by Homer Rebatis)",
  description: `Restricts overused commands for ${RESTRICTION_DURATION / 60000} minutes`,
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

module.exports.handleEvent = async function({ api, event }) {
  const { senderID, threadID, body } = event;
  if (!body) return;

  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;
  if (!body.startsWith(prefix)) return;

  const commandName = body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();

  if (!global.client.commandTracker) global.client.commandTracker = {};
  if (!global.client.commandTracker[senderID]) global.client.commandTracker[senderID] = {};

  const userCommands = global.client.commandTracker[senderID];

  // Check restriction first
  if (userCommands[commandName]?.restricted) {
    const now = Date.now();
    if (now - userCommands[commandName].restrictedTime >= RESTRICTION_DURATION) {
      // Reset restriction
      userCommands[commandName] = { number: 1 };
    } else {
      const remaining = Math.ceil((RESTRICTION_DURATION - (now - userCommands[commandName].restrictedTime)) / 60000);
      return api.sendMessage(`🚫 You are temporarily restricted from using '${commandName}'. Try again in ${remaining} minute(s).`, threadID);
    }
  } else {
    // Increase usage count
    if (!userCommands[commandName]) {
      userCommands[commandName] = { number: 1 };
    } else {
      userCommands[commandName].number += 1;
      if (userCommands[commandName].number >= COMMAND_LIMIT) {
        userCommands[commandName].restricted = true;
        userCommands[commandName].restrictedTime = Date.now();
        return api.sendMessage(
          `🚫 You have used the '${commandName}' command ${COMMAND_LIMIT} times. You are restricted for ${RESTRICTION_DURATION / 60000} minutes.`,
          threadID
        );
      }
    }
  }
};
