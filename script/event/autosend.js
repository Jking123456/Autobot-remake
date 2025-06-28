module.exports.config = {
  name: "autosend",
  eventType: ["minutes"], // listens every minute event for checking time
  version: "0.0.1",
  credits: "vrax",
  description: "Automatically send a message at a specific time"
};

module.exports.run = async ({ event, api, Threads, Users }) => {
  const moment = require("moment-timezone");

  // Use Philippines timezone
  const time = moment.tz("Asia/Manila").format("HH:mm:ss");

  const cantsend = [];
  const allThread = global.data.allThreadID || [];

  // Set your target time here (e.g., 16:52:00 Philippine time)
  if (time === "16:52:00") {
    for (const idThread of allThread) {
      if (isNaN(parseInt(idThread)) || idThread === event.threadID) continue;

      api.sendMessage("Test automatic message", idThread, (error) => {
        if (error) cantsend.push(idThread);
      });
    }

    if (cantsend.length > 0) {
      for (const adminId of global.config.ADMINBOT) {
        api.sendMessage(
          `❌ Failed to send to the following threads:\n${cantsend.join("\n")}`,
          adminId
        );
      }
    }
  }
};
