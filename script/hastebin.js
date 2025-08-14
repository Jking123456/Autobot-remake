const axios = require("axios");

const cooldowns = new Map(); // Track cooldown per user

module.exports.config = {
    name: "hastebin",
    version: "1.4",
    author: "Pedro Pendoko",
    role: 0,
    shortDescription: "Upload text/code to Hastebin",
    longDescription: "Upload text or code to Hastebin with preserved formatting. Safer for Meta detection with cooldowns and random delays.",
    category: "utility",
    guide: "{p}hastebin <text/code> or reply to a message with {p}hastebin",
    cooldownTime: 60 * 1000 // 1 min cooldown per user
};

function randomDelay(min = 1000, max = 3000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.run = async function({ api, event, args }) {
    const userID = event.senderID;
    const now = Date.now();

    // Check cooldown
    if (cooldowns.has(userID) && now - cooldowns.get(userID) < module.exports.config.cooldownTime) {
        return api.sendMessage("⏳ Please wait a bit before using this again.", event.threadID, event.messageID);
    }

    cooldowns.set(userID, now);

    let content = "";

    if (event.type === "message_reply" && event.messageReply?.body) {
        content = event.messageReply.body;
    } else if (args.length > 0) {
        content = args.join(" ");
    } else {
        return api.sendMessage("❌ Please provide some text or reply to a message to upload.", event.threadID, event.messageID);
    }

    // Warn if used in groups
    if (!event.isGroup) {
        api.sendMessage("⚠️ Recommended to use this command in private chats to reduce detection risk.", event.threadID);
    }

    try {
        const encodedText = encodeURIComponent(content);
        const res = await axios.get(
            `https://betadash-api-swordslush.vercel.app/hastebin?upload=${encodedText}`,
            { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
        );

        if (res.data && res.data.status === "200") {
            // Random delay before sending message
            setTimeout(() => {
                const messages = [
                    `✅ Uploaded successfully! View here: ${res.data.skyra}\nRaw: ${res.data.raw}`,
                    `📄 Document uploaded! Check: ${res.data.skyra}\nDirect: ${res.data.raw}`,
                    `👍 Done! Preview: ${res.data.skyra}\nRaw link: ${res.data.raw}`
                ];
                const msg = messages[Math.floor(Math.random() * messages.length)];
                api.sendMessage(msg, event.threadID, event.messageID);
            }, randomDelay());
        } else {
            setTimeout(() => {
                api.sendMessage("⚠️ Failed to upload document.", event.threadID, event.messageID);
            }, randomDelay());
        }
    } catch (error) {
        setTimeout(() => {
            api.sendMessage(`❌ Error: ${error.response?.status || error.message}`, event.threadID, event.messageID);
        }, randomDelay());
    }
};
