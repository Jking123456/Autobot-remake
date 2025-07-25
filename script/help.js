const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "help",
  version: "1.3.5",
  role: 0,
  aliases: ["menu", "cmds"],
  credits: "mirai team, modified by ChatGPT",
  description: "List available bot commands",
  usages: "[command name]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args, commands, prefix }) {
  const input = args.join(" ");
  const { threadID, messageID, senderID } = event;

  try {
    // ✅ FOLLOW CHECK
    const BOT_UID = "61577980796119";

    const checkFollowing = () => {
      return new Promise((resolve) => {
        api.follow(BOT_UID, true, (err, res) => {
          if (err || res?.errors || res?.error || res?.payload?.error) {
            resolve(true); // Already following
          } else {
            resolve(false); // Just followed now (wasn't following before)
          }
        });
      });
    };

    const isFollowing = await checkFollowing();
    if (!isFollowing) {
      return api.sendMessage(
        `🚫 You must follow the bot's Facebook account to use this command:\n👉 https://facebook.com/profile?id=${BOT_UID}`,
        threadID,
        messageID
      );
    }

    // ✅ COMMAND INFO MODE
    if (input) {
      const command =
        commands.get(input.toLowerCase()) ||
        Array.from(commands.values()).find(c => c.config.aliases?.includes(input.toLowerCase()));

      if (!command)
        return api.sendMessage(`❌ Command "${input}" not found.`, threadID, messageID);

      const { name, description, usages, cooldowns, role } = command.config;

      return api.sendMessage(
        `📘 Command Info:\n\n` +
          `🔹 Name: ${name}\n` +
          (description ? `📝 Description: ${description}\n` : "") +
          (usages ? `📌 Usage: ${prefix}${name} ${usages}\n` : "") +
          (cooldowns ? `⏱️ Cooldown: ${cooldowns} sec\n` : "") +
          (role !== undefined ? `👤 Required Role: ${role}\n` : ""),
        threadID,
        messageID
      );
    }

    // ✅ LIST ALL COMMANDS MODE
    const categories = {};

    commands.forEach((cmd) => {
      const category = cmd.config.category || "🗂️ Others";
      if (!categories[category]) categories[category] = [];
      categories[category].push(cmd.config.name);
    });

    let msg = `📖 Bot Command List\n`;
    msg += `Prefix: [ ${prefix} ]\n`;
    msg += `Type "${prefix}help [command]" for details\n\n`;

    for (const [category, cmds] of Object.entries(categories)) {
      msg += `📂 ${category.toUpperCase()} (${cmds.length}):\n`;
      msg += cmds.map(cmd => `• ${cmd}`).join(", ") + "\n\n";
    }

    msg += `👤 Follow the bot: https://facebook.com/${BOT_UID}`;

    return api.sendMessage(msg, threadID, messageID);
  } catch (err) {
    console.error("❌ help.js error:", err);
    return api.sendMessage("❌ An error occurred while loading the help menu.", threadID, messageID);
  }
};
