const axios = require('axios');
const path = require('path');
const fs = require('fs-extra');

const cooldowns = new Map(); // Cooldown tracker

module.exports.config = {
    name: "shoti",
    version: "1.0.0",
    role: 0,
    description: "Fetch a random Shoti video.",
    prefix: false,
    premium: false,
    credits: "Akimitsu",
    cooldowns: 10,
    category: "media"
};

module.exports.run = async function ({ api, event }) {
    const senderID = event.senderID;
    const now = Date.now();
    const cooldownTime = 60 * 1000; // 1 minute

    // Cooldown check
    if (cooldowns.has(senderID)) {
        const expiration = cooldowns.get(senderID);
        if (now < expiration) {
            const remaining = ((expiration - now) / 1000).toFixed(0);
            return api.sendMessage(`⏳ Please wait ${remaining} seconds before using the "shoti" command again.`, event.threadID, event.messageID);
        }
    }

    cooldowns.set(senderID, now + cooldownTime);

    try {
        api.sendMessage("🎬 𝗙𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝗮 𝗿𝗮𝗻𝗱𝗼𝗺 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼, 𝗽𝗹𝗲𝗮𝘀𝗲 𝘄𝗮𝗶𝘁...", event.threadID, event.messageID);

        const response = await axios.get('https://kaiz-apis.gleeze.com/api/shoti?apikey=25644cdb-f51e-43f1-894a-ec718918e649');
        const data = response.data?.shoti;

        if (!data || !data.videoUrl) {
            return api.sendMessage('❌ 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝗳𝗲𝘁𝗰𝗵 𝗮 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿.', event.threadID, event.messageID);
        }

        const fileName = `${event.messageID}.mp4`;
        const filePath = path.join(__dirname, fileName);

        const downloadResponse = await axios({
            method: 'GET',
            url: data.videoUrl,
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(filePath);
        downloadResponse.data.pipe(writer);

        writer.on('finish', async () => {
            api.sendMessage({
                body: `🎥 𝗛𝗲𝗿𝗲’𝘀 𝘆𝗼𝘂𝗿 𝗿𝗮𝗻𝗱𝗼𝗺 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼!\n\n📌 𝗧𝗶𝘁𝗹𝗲: ${data.title}\n👤 𝗨𝘀𝗲𝗿: @${data.username}`,
                attachment: fs.createReadStream(filePath)
            }, event.threadID, () => {
                fs.unlinkSync(filePath); // Clean up
            }, event.messageID);
        });

        writer.on('error', () => {
            api.sendMessage('🚫 𝗘𝗿𝗿𝗼𝗿 𝗱𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗶𝗻𝗴 𝘁𝗵𝗲 𝘃𝗶𝗱𝗲𝗼. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻.', event.threadID, event.messageID);
        });

    } catch (error) {
        console.error('Error fetching Shoti video:', error);
        api.sendMessage('🚫 𝗘𝗿𝗿𝗼𝗿 𝗳𝗲𝘁𝗰𝗵𝗶𝗻𝗴 𝗦𝗵𝗼𝘁𝗶 𝘃𝗶𝗱𝗲𝗼. 𝗧𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿.', event.threadID, event.messageID);
    }
};
