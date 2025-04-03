const axios = require('axios');

module.exports.config = {
    name: "ai",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Jay",
    description: "EDUCATIONAL",
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
        const apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(question)}&uid=1&webSearch=off`;

        if (!question) {
            return api.sendMessage("You don't have a question!", event.threadID, event.messageID);
        }

        try {
            const response = await axios.get(apiUrl);
            const answer = response.data.response;

            api.sendMessage(`•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝚄𝚃𝙾𝙱𝙾𝚃 |•\n\n𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻 : ${question}\n\n𝗔𝗻𝘀𝘄𝗲𝗿 : ${answer}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`, event.threadID, event.messageID);
        } catch (error) {
            console.error(error);
            api.sendMessage("Unexpected error from this Homer AI Bot.", event.threadID, event.messageID);
        }
    }
};
