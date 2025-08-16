const axios = require("axios");

// Store sessions per user
let sessions = {};

module.exports.config = {
    name: "ai",
    version: "2.2.0",
    hasPermssion: 0,
    credits: "Jay + Modified",
    description: "AI with threaded replies, session reset & random delay",
    usePrefix: true,
    commandCategory: "AI",
    usages: "[question|block <fb user id>]",
    cooldowns: 5
};

// Helper function: random delay between 3s–7s
function getRandomDelay() {
    return Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000; 
}

module.exports.run = async function ({ api, event, args }) {
    const command = args[0];
    const restArgs = args.slice(1);

    if (!command) {
        return api.sendMessage("Please provide a command or question!", event.threadID, event.messageID);
    }

    // BLOCK COMMAND
    if (command.toLowerCase() === "block") {
        const userId = restArgs[0];
        if (!userId) {
            return api.sendMessage("Please provide a Facebook user ID to block!", event.threadID, event.messageID);
        }

        try {
            await api.blockUser(userId);
            return api.sendMessage(`User with ID ${userId} has been blocked.`, event.threadID, event.messageID);
        } catch (error) {
            console.error(error);
            return api.sendMessage("Failed to block the user. Please try again.", event.threadID, event.messageID);
        }
    }

    // AI SESSION HANDLER
    const userId = event.senderID;
    const question = args.join(" ");
    const apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(question)}&uid=${userId}&webSearch=off`;

    if (!question) {
        return api.sendMessage("You don't have a question!", event.threadID, event.messageID);
    }

    try {
        const response = await axios.get(apiUrl);
        const answer = response.data.response;

        // Clear old session if exists
        if (sessions[userId]) {
            clearTimeout(sessions[userId].timeout);
        }

        // Create new session
        sessions[userId] = {
            lastMessageID: null,
            timeout: setTimeout(() => {
                delete sessions[userId];
            }, 15 * 60 * 1000) // auto reset after 15 minutes
        };

        // Random delay
        setTimeout(() => {
            api.sendMessage(
                `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻 : ${question}\n\n𝗔𝗻𝘀𝘄𝗲𝗿 : ${answer}\n\n(Reply "reset" to reset session)`,
                event.threadID,
                (err, info) => {
                    if (!err) {
                        sessions[userId].lastMessageID = info.messageID;
                    }
                },
                event.messageID
            );
        }, getRandomDelay());

    } catch (error) {
        console.error(error);
        api.sendMessage("Unexpected error from UEP MAIN BOT.", event.threadID, event.messageID);
    }
};

// HANDLE REPLIES
module.exports.handleReply = async function ({ api, event }) {
    const userId = event.senderID;

    // Check if user has active session & reply is under bot’s message
    if (!sessions[userId] || sessions[userId].lastMessageID !== event.messageReply?.messageID) {
        return;
    }

    const userMessage = event.body.trim();

    // RESET SESSION
    if (userMessage.toLowerCase() === "reset") {
        clearTimeout(sessions[userId].timeout);
        delete sessions[userId];
        return api.sendMessage("✅ Your AI session has been reset.", event.threadID, event.messageID);
    }

    // Continue AI conversation
    const apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${encodeURIComponent(userMessage)}&uid=${userId}&webSearch=off`;

    try {
        const response = await axios.get(apiUrl);
        const answer = response.data.response;

        // Reset session timer
        clearTimeout(sessions[userId].timeout);
        sessions[userId].timeout = setTimeout(() => {
            delete sessions[userId];
        }, 15 * 60 * 1000);

        // Random delay
        setTimeout(() => {
            api.sendMessage(
                `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻 : ${userMessage}\n\n𝗔𝗻𝘀𝘄𝗲𝗿 : ${answer}\n\n(Reply "reset" to reset session)`,
                event.threadID,
                (err, info) => {
                    if (!err) {
                        sessions[userId].lastMessageID = info.messageID;
                    }
                },
                event.messageID
            );
        }, getRandomDelay());

    } catch (error) {
        console.error(error);
        api.sendMessage("⚠️ Error while processing AI response.", event.threadID, event.messageID);
    }
};
