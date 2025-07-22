const fs = require("fs-extra");

module.exports.config = {
  name: "noti",
  version: "1.1.2",
  role: 1,
  description: "Sends a message to all groups and can only be done by the admin.",
  hasPrefix: false,
  aliases: ["noti"],
  usages: "[Text]",
  cooldown: 0,
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const customMessage = args.join(" ");
    if (!customMessage) {
      return api.sendMessage("⚠️ Please provide a message to send.", event.threadID);
    }

    console.log("📥 Starting noti command...");
    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    console.log(`✅ Got ${threadList.length} threads.`);

    let testCount = 0;
    for (const thread of threadList) {
      if (!thread.isGroup || thread.threadID === event.threadID) continue;
      console.log(`🔁 Preparing to send to: ${thread.threadID}`);

      const message = `🧪 Test notification:\n${customMessage}`;
      await api.sendMessage(message, thread.threadID);
      console.log(`✅ Sent to ${thread.threadID}`);
      testCount++;
      if (testCount >= 1) break; // only send to 1 group for now
    }

    if (testCount > 0) {
      api.sendMessage("✅ Test notification sent successfully.", event.threadID);
    } else {
      api.sendMessage("⚠️ No valid group threads found.", event.threadID);
    }

  } catch (err) {
    console.error("❌ ERROR IN NOTI COMMAND:", err);
    api.sendMessage("⚠️ ERROR OCCURRED: " + err.message, event.threadID);
  }
};
