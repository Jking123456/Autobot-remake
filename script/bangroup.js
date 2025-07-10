const fs = require("fs");
const path = require("path");

const bannedGroupsPath = path.join(__dirname, "bannedGroups.json");

// Ensure bannedGroups.json exists
if (!fs.existsSync(bannedGroupsPath)) {
  fs.writeFileSync(bannedGroupsPath, JSON.stringify(["24157068820592285"], null, 2));
}

let bannedGroups = JSON.parse(fs.readFileSync(bannedGroupsPath, "utf-8"));

// Your user ID as the only admin allowed
const BOT_ADMIN_ID = "100044848836284";

module.exports = function (api) {
  api.listenMqtt((err, message) => {
    if (err || !message || !message.threadID) return;

    const threadID = message.threadID;
    const senderID = message.senderID;
    const body = message.body?.toLowerCase();

    // 🔒 If banned group, show warning and exit
    if (bannedGroups.includes(threadID)) {
      api.sendMessage("❌ This group chat is banned from using AutoBot.", threadID);
      return;
    }

    // 🔐 Only admin can ban/unban groups
    if (senderID !== BOT_ADMIN_ID) {
      if (body === "/ban this group" || body === "/unban this group") {
        api.sendMessage("⚠️ You are not authorized to use this command.", threadID);
        return;
      }
    }

    // ✅ Ban command by admin
    if (body === "/ban this group") {
      if (!bannedGroups.includes(threadID)) {
        bannedGroups.push(threadID);
        fs.writeFileSync(bannedGroupsPath, JSON.stringify(bannedGroups, null, 2));
        api.sendMessage("❌ This group has been banned from using AutoBot.", threadID);
      }
      return;
    }

    // ✅ Unban command by admin
    if (body === "/unban this group") {
      if (bannedGroups.includes(threadID)) {
        bannedGroups = bannedGroups.filter(id => id !== threadID);
        fs.writeFileSync(bannedGroupsPath, JSON.stringify(bannedGroups, null, 2));
        api.sendMessage("✅ This group has been unbanned.", threadID);
      }
      return;
    }

    // 🧠 Bot logic for allowed groups only
    if (body === "/ping") {
      api.sendMessage("Pong 🏓", threadID);
    }
  });
};
