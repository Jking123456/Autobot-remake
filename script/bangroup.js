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
    version: "1.1.0",
    role: 2,
    aliases: ["blockgroup", "ban"],
    credits: "Ulric Atayi - Modified by ChatGPT",
    description: "Ban or unban a group by ID from using AutoBot",
    cooldown: 3,
};

module.exports.run = async function ({ api, event, args }) {
    const { senderID, threadID, messageID } = event;
    const reply = msg => api.sendMessage(msg, threadID, messageID);

    if (senderID !== ADMIN_ID) {
        return reply("⚠️ You are not authorized to use this command.");
    }

    if (!args[0]) {
        return reply("❗ Usage:\n→ bangroup [group id]");
    }

    const targetGroupID = args[0].trim();

    if (!/^\d+$/.test(targetGroupID)) {
        return reply("⚠️ Invalid group ID. Please provide a valid numeric group ID.");
    }

    if (bannedGroups.includes(targetGroupID)) {
        // Unban if already banned
        bannedGroups = bannedGroups.filter(id => id !== targetGroupID);
        fs.writeFileSync(bannedGroupsPath, JSON.stringify(bannedGroups, null, 2));
        return reply(`✅ Group ID ${targetGroupID} has been unbanned.`);
    } else {
        // Ban if not banned
        bannedGroups.push(targetGroupID);
        fs.writeFileSync(bannedGroupsPath, JSON.stringify(bannedGroups, null, 2));
        return reply(`❌ Group ID ${targetGroupID} has been banned from using AutoBot.`);
    }
};
