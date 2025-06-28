const moment = require("moment-timezone");

const num = 10; // Number of allowed spam messages before banning
const timee = 120; // Time window in seconds

module.exports.config = {
  name: "spamban",
  version: "2.0.0",
  hasPermission: 0,
  credits: "NTKhang (Fix by D-Jukie & ChatGPT)",
  description: `Automatically bans users who spam ${num} times within ${timee} seconds`,
  commandCategory: "System",
  usages: "x",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    `⚠️ Users who spam ${num} times within ${timee}s will be automatically banned.`,
    event.threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  const { senderID, threadID, body } = event;

  // Check if it's a valid command
  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;
  if (!body || !body.startsWith(prefix)) return;

  // Initialize global.autoban storage
  if (!global.client.autoban) global.client.autoban = {};

  if (!global.client.autoban[senderID]) {
    global.client.autoban[senderID] = {
      timeStart: Date.now(),
      number: 0
    };
  }

  const userSpamData = global.client.autoban[senderID];

  if (userSpamData.timeStart + (timee * 1000) <= Date.now()) {
    // Reset counter if time exceeded
    userSpamData.timeStart = Date.now();
    userSpamData.number = 1;
  } else {
    userSpamData.number++;

    if (userSpamData.number >= num) {
      const threadData = await Threads.getData(threadID);
      const threadInfo = threadData?.threadInfo || {};
      const threadName = threadInfo.threadName || "Unknown";

      const timeDate = moment.tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss");

      const userData = await Users.getData(senderID) || {};
      const userExtraData = userData.data || {};

      // Skip if already banned
      if (userExtraData.banned === true) return;

      // Set ban info
      userExtraData.banned = true;
      userExtraData.reason = `Spammed ${num} times in ${timee} seconds`;
      userExtraData.dateAdded = timeDate;

      await Users.setData(senderID, { data: userExtraData });
      global.data.userBanned.set(senderID, {
        reason: userExtraData.reason,
        dateAdded: userExtraData.dateAdded
      });

      // Reset spam tracking
      global.client.autoban[senderID] = {
        timeStart: Date.now(),
        number: 0
      };

      // Notify the thread
      api.sendMessage(
        `⚠️ User ${senderID} (${userData.name}) has been automatically banned.\nReason: ${userExtraData.reason}\nReported to bot admin.`,
        threadID
      );

      // Notify admins
      const admins = global.config.ADMINBOT;
      if (Array.isArray(admins)) {
        for (const adminID of admins) {
          api.sendMessage(
            `🚫 Auto-ban Report:\n👤 Name: ${userData.name}\n🆔 ID: ${senderID}\n💬 Thread: ${threadName}\n🆔 Thread ID: ${threadID}\n📅 Time: ${timeDate}\n📌 Reason: ${userExtraData.reason}`,
            adminID
          );
        }
      }
    }
  }
};
