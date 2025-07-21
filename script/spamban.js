const moment = require("moment-timezone");

const SPAM_LIMIT = 5; // Allowed number of spam attempts
const TIME_WINDOW = 10; // Time window in seconds
const BAN_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

module.exports.config = {
  name: "spamban",
  version: "2.0.1",
  hasPermission: 0,
  credits: "NTKhang (Fixed by Homer Rebatis",
  description: `Automatically bans users who spam ${SPAM_LIMIT} times within ${TIME_WINDOW} seconds`,
  commandCategory: "System",
  usages: "x",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    `⚠️ Users who spam ${SPAM_LIMIT} times within ${TIME_WINDOW} seconds will be automatically banned for 1 day.`,
    event.threadID,
    event.messageID
  );
};

module.exports.handleEvent = async function ({ Users, Threads, api, event }) {
  const { senderID, threadID, body } = event;

  if (!body) return;

  const threadSetting = global.data.threadData.get(threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (!body.startsWith(prefix)) return;

  if (!global.client.autoban) global.client.autoban = {};

  const userData = await Users.getData(senderID) || {};
  const userExtraData = userData.data || {};

  // Check if user is banned and whether ban has expired
  if (userExtraData.banned && userExtraData.banTime) {
    const now = Date.now();
    if (now - userExtraData.banTime >= BAN_DURATION) {
      // Unban
      userExtraData.banned = false;
      userExtraData.reason = null;
      userExtraData.banTime = null;
      userExtraData.dateAdded = null;

      await Users.setData(senderID, { data: userExtraData });
      global.data.userBanned.delete(senderID);
      return api.sendMessage(`✅ ${userData.name} has been unbanned automatically after 1 day.`, threadID);
    } else {
      return api.sendMessage(`🚫 You are banned from using commands for spamming. Ban lifts automatically after 1 day.`, threadID);
    }
  }

  if (!global.client.autoban[senderID]) {
    global.client.autoban[senderID] = {
      timeStart: Date.now(),
      number: 1
    };
  } else {
    const userSpam = global.client.autoban[senderID];
    const now = Date.now();

    if (now - userSpam.timeStart <= TIME_WINDOW * 1000) {
      userSpam.number += 1;
    } else {
      userSpam.timeStart = now;
      userSpam.number = 1;
    }

    if (userSpam.number >= SPAM_LIMIT) {
      const timeDate = moment.tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss");
      const threadData = await Threads.getData(threadID);
      const threadInfo = threadData?.threadInfo || {};
      const threadName = threadInfo.threadName || "Unknown";

      userExtraData.banned = true;
      userExtraData.banTime = Date.now();
      userExtraData.reason = `Spammed ${SPAM_LIMIT} commands in ${TIME_WINDOW} seconds`;
      userExtraData.dateAdded = timeDate;

      await Users.setData(senderID, { data: userExtraData });
      global.data.userBanned.set(senderID, {
        reason: userExtraData.reason,
        dateAdded: userExtraData.dateAdded
      });

      global.client.autoban[senderID] = null;

      api.sendMessage(
        `🚫 User ${userData.name} has been automatically banned for 1 day.\nReason: ${userExtraData.reason}`,
        threadID
      );

      const admins = global.config.ADMINBOT || [];
      for (const adminID of admins) {
        api.sendMessage(
          `🚨 Auto-ban Report\n👤 Name: ${userData.name}\n🆔 User ID: ${senderID}\n🧵 Thread: ${threadName}\n🧵 Thread ID: ${threadID}\n📆 Time: ${timeDate}\n📌 Reason: ${userExtraData.reason}`,
          adminID
        );
      }
    }
  }
};
