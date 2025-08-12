const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "zombie",
    version: "1.3.1",
    hasPermssion: 0,
    credits: "Who's Deku (Optimized by Homer Rebatis)",
    description: "Transform an image into a zombie",
    commandCategory: "image",
    usages: "[reply to image]",
    cooldowns: 2,
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID } = event;

    // ✅ Admin Check
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const botID = api.getCurrentUserID();

        if (threadInfo.isGroup) {
            const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
            if (!isBotAdmin) {
                return api.sendMessage("🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.", threadID, messageID);
            }
        }
    } catch (error) {
        console.error("⚠️ Admin check failed:", error);
        return api.sendMessage("⚠️ Failed to verify admin status. Please try again later.", threadID, messageID);
    }

    if (event.type !== "message_reply" || event.messageReply.attachments.length === 0) {
        return api.sendMessage("⚠️ Please reply to an image.", threadID, messageID);
    }

    const imageUrl = event.messageReply.attachments[0].url;

    try {
        api.sendMessage("🧟 Generating zombie image, please wait...", threadID, messageID);

        const response = await axios.get(
            `https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`,
            { responseType: "arraybuffer" }
        );

        const imgPath = path.join(__dirname, "cache", `zombie_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, response.data);

        return api.sendMessage({ attachment: fs.createReadStream(imgPath) }, threadID, () => {
            fs.unlinkSync(imgPath); // cleanup
        }, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
};
