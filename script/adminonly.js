const fs = require("fs-extra");
const path = require("path");

// Define path to the config file manually (Auto Bot doesn't auto-manage it)
const configPath = path.join(__dirname, "..", "data", "adminonly-config.json");

// Load or initialize config
let botConfig = {};
try {
  if (fs.existsSync(configPath)) {
    botConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } else {
    botConfig = {
      adminOnly: {
        enable: false
      },
      hideNotiMessage: {
        adminOnly: false
      }
    };
  }
} catch (err) {
  console.error("Failed to load config:", err);
}

module.exports.config = {
  name: "adminonly",
  aliases: ["adonly", "onlyad", "onlyadmin"],
  version: "1.5",
  permission: 2,
  credits: "NTKhang (converted to Auto Bot by ChatGPT)",
  description: "Turn on/off admin-only usage mode",
  prefix: true,
  premium: false,
  category: "owner",
  usage: "{pn} [on | off] | noti [on | off]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const send = msg => api.sendMessage(msg, event.threadID, event.messageID);

  let isSetNoti = false;
  let value;
  let indexGetVal = 0;

  if (!args.length) return send("❌ Please provide an argument: on/off or noti on/off");

  // Check if "noti" option is used
  if (args[0]?.toLowerCase() === "noti") {
    isSetNoti = true;
    indexGetVal = 1;
  }

  const input = args[indexGetVal]?.toLowerCase();
  if (input === "on") {
    value = true;
  } else if (input === "off") {
    value = false;
  } else {
    return send("❌ Invalid argument. Use 'on' or 'off'.");
  }

  if (isSetNoti) {
    botConfig.hideNotiMessage.adminOnly = !value;
    send(value ? "🔔 Notification when non-admins use the bot is ON." : "🔕 Notification is OFF.");
  } else {
    botConfig.adminOnly.enable = value;
    send(value ? "🔒 Admin-only mode is now ENABLED." : "🔓 Admin-only mode is now DISABLED.");
  }

  // Save updated config
  try {
    fs.ensureDirSync(path.dirname(configPath));
    fs.writeFileSync(configPath, JSON.stringify(botConfig, null, 2));
  } catch (err) {
    return send("❌ Failed to save config: " + err.message);
  }
};
