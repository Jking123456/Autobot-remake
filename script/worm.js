const axios = require('axios');

module.exports.config = {
    name: "worm",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "You",
    description: "Educational Goat Bot using plain-text API",
    usePrefix: true,
    commandCategory: "AI",
    usages: "[question|block <fb user id>]",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {
    const command = args[0];
    const restArgs = args.slice(1);
    
    if (!command) {
        return api.sendMessage("Please provide a command or question!", event.threadID, event.messageID);
    }

    if (command.toLowerCase() === "block") {
        const userId = restArgs[0];
        if (!userId) {
            return api.sendMessage("Please provide a Facebook user ID to block!", event.threadID, event.messageID);
        }

        try {
            await api.blockUser(userId);
            api.sendMessage(`User with ID ${userId} has been blocked.`, event.threadID, event.messageID);
        } catch (error) {
            console.error(error);
            api.sendMessage("Failed to block the user. Please try again.", event.threadID, event.messageID);
        }
    } else {
        const question = args.join(' ');
        const apiUrl = `https://newtonhack.serv00.net/GPT/wormgpt.php?ask=${encodeURIComponent(question)}`;

        if (!question) {
            return api.sendMessage("You don't have a question!", event.threadID, event.messageID);
        }

        try {
            const response = await axios.get(apiUrl, { responseType: 'text' });
            const answer = response.data; // Plain text from your API

            api.sendMessage(
                `•| WORM CHATGPT |•\n\n` +
                `𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻 : ${question}\n\n` +
                `𝗔𝗻𝘀𝘄𝗲𝗿 : ${answer}\n\n` +
                `•| OWNER : ANONYMOUS GUY |•`,
                event.threadID,
                event.messageID
            );
        } catch (error) {
            console.error(error);
            api.sendMessage("Unexpected error from Goat Bot.", event.threadID, event.messageID);
        }
    }
};
