const cron = require("node-cron");

module.exports.config = {
  name: "greetingscheduler",
  version: "1.0.0",
  hasPermission: 2,
  credits: "YourName",
  description: "Sends scheduled greetings to all groups",
  commandCategory: "system",
  usages: "",
  cooldowns: 5,
};

module.exports.onLoad = function({ api }) {
  const sendToGroups = (msg) => {
    api.getThreadList(30, null, ["INBOX"], (err, list) => {
      if (err) return console.log("ERR: " + err);
      list.forEach(thread => {
        if (thread.isGroup) {
          api.sendMessage(msg, thread.threadID);
        }
      });
    });
  };

  cron.schedule('0 0 6 * * *', () => sendToGroups("Good morning everyone! It's time to wake up."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 9 * * *', () => sendToGroups("Good morning! Have a great day ahead."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 12 * * *', () => sendToGroups("Good afternoon! It's lunchtime."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 13 * * *', () => sendToGroups("Good afternoon everyone!"), { timezone: "Asia/Manila" });
  cron.schedule('0 0 15 * * *', () => sendToGroups("Hello there! It's 3:00 PM."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 17 * * *', () => sendToGroups("Good afternoon! It's 5:00 PM."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 18 * * *', () => sendToGroups("Good evening! It's 6:00 PM."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 19 * * *', () => sendToGroups("Good evening! It's dinner time."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 21 * * *', () => sendToGroups("Good evening! It's 9:00 PM."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 22 * * *', () => sendToGroups("Goodnight everyone! Sweet dreams."), { timezone: "Asia/Manila" });
  cron.schedule('0 0 0 * * *', () => sendToGroups("Goodnight everyone! It's midnight."), { timezone: "Asia/Manila" });

  console.log("Greeting scheduler loaded.");
};
