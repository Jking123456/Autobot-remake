const axios = require("axios");

let sessions = {};

module.exports.config = {
    name: "ai",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Jay + Modified",
    description: "AI with threaded replies, session reset & random delay (LLaMA 3 API)",
    usePrefix: true,
    commandCategory: "AI",
    usages: "[question|block <fb user id>]",
    cooldowns: 5
};

// Helper function: random delay between 3s–7s
function getRandomDelay() {
    return Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000; 
}

const API_KEY = "25644cdb-f51e-43f1-894a-ec718918e649";
const BASE_URL = "https://kaiz-apis.gleeze.com/api/llama3-turbo";

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
    const apiUrl = `${BASE_URL}?ask=${encodeURIComponent(question)}&uid=${userId}&apikey=${API_KEY}`;

    if (!question) {
        return api.sendMessage("You don't have a question!", event.threadID, event.messageID);
    }

    try {
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.response) {
            console.error("Invalid API response:", response.data);
            return api.sendMessage("⚠️ API returned an unexpected response. Please try again later.", event.threadID, event.messageID);
        }

        const answer = response.data.response;

        if (sessions[userId]) clearTimeout(sessions[userId].timeout);

        sessions[userId] = {
            lastMessageID: null,
            timeout: setTimeout(() => {
                delete sessions[userId];
            }, 15 * 60 * 1000) // auto reset after 15 minutes
        };

        setTimeout(() => {
            api.sendMessage(
                `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}`,
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
        console.error("API Request Failed:", error?.response?.data || error.message || error);
        api.sendMessage("⚠️ UEP MAIN BOT cannot connect to the AI API right now.", event.threadID, event.messageID);
    }
};

// HANDLE REPLIES
module.exports.handleReply = async function ({ api, event }) {
    const userId = event.senderID;

    // Only continue if reply is under the bot's last message
    if (!sessions[userId] || sessions[userId].lastMessageID !== event.messageReply?.messageID) {
        return;
    }

    const userMessage = event.body.trim();

    // Reset session if "reset"
    if (userMessage.toLowerCase() === "reset") {
        clearTimeout(sessions[userId].timeout);
        delete sessions[userId];
        return api.sendMessage("✅ Your AI session has been reset.", event.threadID, event.messageID);
    }

    const apiUrl = `${BASE_URL}?ask=${encodeURIComponent(userMessage)}&uid=${userId}&apikey=${API_KEY}`;

    try {
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.response) {
            console.error("Invalid API response:", response.data);
            return api.sendMessage("⚠️ API returned an unexpected response. Please try again later.", event.threadID, event.messageID);
        }

        const answer = response.data.response;

        clearTimeout(sessions[userId].timeout);
        sessions[userId].timeout = setTimeout(() => {
            delete sessions[userId];
        }, 15 * 60 * 1000);

        setTimeout(() => {
            api.sendMessage(
                `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}`,
                event.threadID,
                (err, info) => {
                    if (!err) sessions[userId].lastMessageID = info.messageID;
                },
                event.messageID
            );
        }, getRandomDelay());

    } catch (error) {
        console.error("API Request Failed:", error?.response?.data || error.message || error);
        api.sendMessage("⚠️ UEP MAIN BOT cannot connect to the AI API right now.", event.threadID, event.messageID);
    }
};
