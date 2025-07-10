const fs = require("fs");
const path = require("path");

const bannedGroupsPath = path.join(__dirname, "bannedGroups.json");

// Ensure bannedGroups.json exists
if (!fs.existsSync(bannedGroupsPath)) {
    fs.writeFileSync(bannedGroupsPath, JSON.stringify(["24157068820592285"], null, 2));
}
let bannedGroups = JSON.parse(fs.readFileSync(bannedGroupsPath, "utf-8"));

const ADMIN_ID = "100044848836284";

module.exports.config = {
    name: "bangroup",
    version: "1.0.0",
    role: 2,
    aliases: ["blockgroup", "ban"],
    credits: "Ulric Atayi",
    description: "Ban or unban a group from using AutoBot",
    cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, senderID, messageID } = event;
    const reply = msg => api.sendMessage(msg, threadID, messageID);

    // Only admin can use this command
    if (senderID !== ADMIN_ID) return reply("⚠️ You are not authorized to use this command.");

    if (!args[0]) {
        return reply("❗ Usage:\n→ bangroup ban\n→ bangroup unban");
    }

    const action = args[0].toLowerCase();

    // Ban current group
    if (action === "ban") {
        if (bannedGroups.includes(threadID)) {
            return reply("⚠️ This group is already banned.");
        }
        bannedGroups.push(threadID);
        fs.writeFileSync(bannedGroupsPath, JSON.stringify(bannedGroups, null, 2));
        return reply("❌ This group has been banned from using AutoBot.");
    }

    // Unban current group
    if (action === "unban") {
        if (!bannedGroups.includes(threadID)) {
            return reply("⚠️ This group is not in the banned list.");
        }
        bannedGroups = bannedGroups.filter(id => id !== threadID);
        fs.writeFileSync(bannedGroupsPath, JSON.stringify(bannedGroups, null, 2));
        return reply("✅ This group has been unbanned and can now use AutoBot.");
    }

    return reply("❗ Invalid option. Use:\n→ bangroup ban\n→ bangroup unban");
};
