const axios = require('axios');
const fs = require('fs');

const cooldowns = new Map(); // Track last welcome per thread

module.exports.config = {
    name: "welcome",
    version: "1.5.0",
    credits: "Homer Rebatis",
    description: "Sends a welcome message with image using Kaiz API (Meta-safe version)",
    usages: "Auto on member join if bot is admin",
    cooldown: 30, // Minimum 30 seconds between welcomes per group
};

module.exports.handleEvent = async function ({ api, event }) {
    try {
        // Only trigger for new members
        if (event.logMessageType !== "log:subscribe") return;

        const threadID = event.threadID;
        const addedParticipants = event.logMessageData.addedParticipants;

        // Rate limiting per group
        const lastWelcome = cooldowns.get(threadID) || 0;
        if (Date.now() - lastWelcome < 30 * 1000) return; // 30s cooldown
        cooldowns.set(threadID, Date.now());

        // Ensure bot is admin to reduce detection
        const botID = api.getCurrentUserID();
        const threadInfo = await api.getThreadInfo(threadID);
        if (!threadInfo.adminIDs.some(adm => adm.id == botID)) {
            await api.sendMessage(
                "⚠️ I need to be an admin to send welcome messages safely.",
                threadID
            );
            return;
        }

        const senderID = addedParticipants[0].userFbId;
        // Fetch user info once and cache to reduce repeated API calls
        let userInfo = await api.getUserInfo(senderID);
        let name = userInfo[senderID]?.name || "New Member";
        const gender = userInfo[senderID]?.gender;
        const prefix = gender === 2 ? "Mr." : gender === 1 ? "Miss" : "";

        const maxLength = 15;
        if (name.length > maxLength) name = name.substring(0, maxLength - 3) + '...';

        const groupName = threadInfo.threadName || "this group";
        const memberCount = threadInfo.participantIDs.length;
        const background = threadInfo.imageSrc || "https://i.ibb.co/4YBNyvP/images-76.jpg";

        // Kaiz Welcome API (use cached avatar if possible)
        const avatarUrl = `https://kaiz-apis.gleeze.com/api/facebookpfp?uid=${senderID}&apikey=12417c89-ac72-4c8e-a174-9ee378771b24`;
        const apiUrl = `https://kaiz-apis.gleeze.com/api/welcome?username=${encodeURIComponent(name)}&avatarUrl=${encodeURIComponent(avatarUrl)}&groupname=${encodeURIComponent(groupName)}&bg=${encodeURIComponent(background)}&memberCount=${memberCount}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

        const { data } = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        if (!fs.existsSync('./cache')) fs.mkdirSync('./cache');
        const filePath = './cache/welcome.jpg';
        fs.writeFileSync(filePath, Buffer.from(data));

        const welcomeMessage = `
🌟 𝙒𝙀𝙇𝘾𝙊𝙈𝙀 𝘼𝘽𝙊𝘼𝙍𝘿 🌟

👤 Name: ${prefix} ${name}
👥 Group: ${groupName}
🔢 Member #: ${memberCount}

💬 We're thrilled to have you here!
🤝 Feel free to interact, share, and enjoy your stay.

━━━━━━━━━━━━━━━━━━━━━━━
👑 Admin: Homer Rebatis
💖 Sending warm vibes!`;

        await api.sendMessage({
            body: welcomeMessage,
            attachment: fs.createReadStream(filePath)
        }, threadID, () => fs.unlinkSync(filePath));

    } catch (error) {
        console.error("Welcome handler error:", error);
        await api.sendMessage({
            body: "🌟 Welcome! Could not load image, but happy to have you here! 💖"
        }, event.threadID);
    }
};
