module.exports.config = {
  name: 'help',
  version: '1.0.0',
  role: 0,
  hasPrefix: true,
  aliases: ['info'],
  description: "Beginner's guide",
  usage: "Help [page] or [command]",
  credits: 'Ulric dev',
};

module.exports.run = async function({ api, event, enableCommands, args, Utils, prefix }) {
  const input = args.join(' ');
  try {
    const eventCommands = enableCommands[1].handleEvent;
    const commands = enableCommands[0].commands;

    // Notice message about anti-spam system
    const notice = `⚠️ NOTICE:\nThis bot has an anti-spamming system. Abusing commands may result in temporary restrictions.\n━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (!input) {
      const pages = 20;
      let page = 1;
      let start = (page - 1) * pages;
      let end = start + pages;
      let helpMessage = `${notice}📜 Available Commands (Page ${page}/${Math.ceil(commands.length / pages)}):\n\n`;

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
      const pages = 20;
      let start = (page - 1) * pages;
      let end = start + pages;
      let helpMessage = `${notice}📜 Available Commands (Page ${page}/${Math.ceil(commands.length / pages)}):\n\n`;

      for (let i = start; i < Math.min(end, commands.length); i++) {
        helpMessage += `🔹 ${i + 1}. ${prefix}${commands[i]}\n`;
      }

      helpMessage += `\n🧩 Event Commands:\n`;
      eventCommands.forEach((eventCommand, index) => {
        helpMessage += `🔸 ${index + 1}. ${prefix}${eventCommand}\n`;
      });

      api.sendMessage(helpMessage, event.threadID, event.messageID);

    } else {
      const command = [...Utils.handleEvent, ...Utils.commands].find(([key]) => key.includes(input?.toLowerCase()))?.[1];
      if (command) {
        const {
          name,
          version,
          role,
          aliases = [],
          description,
          usage,
          credits,
          cooldown,
        } = command;

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
  if (body?.toLowerCase().startsWith('prefix')) {
    const message = prefix ? `This is my prefix: ${prefix}` : "Sorry, I don't have a prefix.";
    api.sendMessage(message, threadID, messageID);
  }
};
