module.exports.config = {
  name: 'help',
  version: '1.2.0',
  role: 0,
  hasPrefix: true,
  aliases: ['info'],
  description: "Beginner's guide",
  usage: "Help [page] or [command]",
  credits: 'Homer Rebatis + Modified by GPT-5',
};

let dailyUsage = {}; // ✅ Track usage per group (help OR prefix) once per 24h

module.exports.run = async function({ api, event, enableCommands, args, Utils, prefix }) {
  const input = args.join(' ');
  const threadId = event.threadID;

  // ✅ Allow only once per 24h per group
  if (dailyUsage[threadId]) return;
  dailyUsage[threadId] = true;
  setTimeout(() => delete dailyUsage[threadId], 24 * 60 * 60 * 1000);

  try {
    // Check if bot is admin in this group
    const threadInfo = await api.getThreadInfo(event.threadID);
    const botID = api.getCurrentUserID();
    const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);

    if (!botIsAdmin) {
      return api.sendMessage(
        "⚠️ I need to be an admin in this group to show all commands. This restriction is for anti-detection and anti-spamming purposes. Please promote me to admin first.",
        event.threadID,
        event.messageID
      );
    }

    const eventCommands = enableCommands[1].handleEvent;
    const commands = enableCommands[0].commands;

    const notice = `⚠️ NOTICE:
This bot has an anti-spamming system. Abusing commands may result in temporary restrictions.
🔒 Some commands are locked — to unlock them, make the bot an admin in this group.
━━━━━━━━━━━━━━━━━━\n`;

    if (!input) {
      const perPage = 20;
      const page = 1;
      const start = (page - 1) * perPage;
      const end = start + perPage;

      let helpMessage = `${notice}📜 Available Commands (Page ${page}/${Math.ceil(commands.length / perPage)}):\n`;
      helpMessage += `🧾 Total Commands: ${commands.length}\n`;
      helpMessage += `📌 Event Commands: ${eventCommands.length}\n`;
      helpMessage += `📊 Combined Total: ${commands.length + eventCommands.length}\n\n`;

      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `🔹 ${i + 1}. ${prefix}${commands[i]}\n`;
      }

      helpMessage += `\n🧩 Event Commands:\n`;
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `🔸 ${index + 1}. ${prefix}${eventCommand}\n`;
      });

      helpMessage += `\n➡️ Type "${prefix}help [page number]" to navigate.\n➡️ Type "${prefix}help [command]" for command details.`;

      api.sendMessage(helpMessage, event.threadID, event.messageID);

    } else if (!isNaN(input)) {
      const page = parseInt(input);
      const perPage = 20;
      const totalPages = Math.ceil(commands.length / perPage);

      if (page < 1 || page > totalPages)
        return api.sendMessage(`❌ Invalid page number. Please choose between 1 and ${totalPages}.`, event.threadID, event.messageID);

      const start = (page - 1) * perPage;
      const end = start + perPage;

      let helpMessage = `${notice}📜 Available Commands (Page ${page}/${totalPages}):\n`;
      helpMessage += `🧾 Total Commands: ${commands.length}\n`;
      helpMessage += `📌 Event Commands: ${eventCommands.length}\n`;
      helpMessage += `📊 Combined Total: ${commands.length + eventCommands.length}\n\n`;

      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `🔹 ${i + 1}. ${prefix}${commands[i]}\n`;
      }

      helpMessage += `\n🧩 Event Commands:\n`;
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `🔸 ${index + 1}. ${prefix}${eventCommand}\n`;
      });

      helpMessage += `\n➡️ Type "${prefix}help [page number]" to navigate.\n➡️ Type "${prefix}help [command]" for command details.`;

      api.sendMessage(helpMessage, event.threadID, event.messageID);

    } else {
      const command = [...Utils.handleEvent, ...Utils.commands].find(([key]) => key.includes(input?.toLowerCase()))?.[1];
      if (command) {
        const { name, version, role, aliases = [], description, usage, credits, cooldown } = command;

        const roleMessage = role !== undefined ? (
          role === 0 ? 'User' :
          role === 1 ? 'Admin' :
          role === 2 ? 'Thread Admin' :
          role === 3 ? 'Super Admin' : 'Unknown'
        ) : 'Unknown';

        const message =
`${notice}📌 Command Info: ${name}

🔖 Version: ${version || 'N/A'}
🧠 Permission: ${roleMessage}
🔁 Aliases: ${aliases.length ? aliases.join(', ') : 'None'}
📘 Description: ${description || 'None'}
📝 Usage: ${usage || 'N/A'}
⏱ Cooldown: ${cooldown ? `${cooldown} second(s)` : 'None'}
👤 Credits: ${credits || 'Unknown'}`;

        api.sendMessage(message, event.threadID, event.messageID);
      } else {
        api.sendMessage(`${notice}❌ Command not found. Please check the command name.`, event.threadID, event.messageID);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.handleEvent = async function({ api, event, prefix }) {
  const { threadID, messageID, body } = event;

  if (body?.toLowerCase().trim() === 'prefix') {
    // ✅ Allow only once per 24h per group (shared with help command)
    if (!dailyUsage[threadID]) {
      dailyUsage[threadID] = true;

      api.sendMessage(`This is my prefix: ${prefix}`, threadID, messageID);

      // Reset after 24h
      setTimeout(() => {
        delete dailyUsage[threadID];
      }, 24 * 60 * 60 * 1000);
    }
    // Else: Silent (no reply)
  }
};
