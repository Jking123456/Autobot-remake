const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "zombie",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "Who's Deku (Modified by Homer Rebatis)",
    description: "Apply zombie filter to an image",
    commandCategory: "image",
    usages: "[reply to image]",
    cooldowns: 1,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    let imageUrl;
    if (event.type === "message_reply" && event.messageReply.attachments.length > 0) {
        imageUrl = event.messageReply.attachments[0].url;
    } else {
        return api.sendMessage("⚠️ Please reply to an image.", threadID, messageID);
    }

    try {
        api.sendMessage("🧟 Uploading to Imgur, please wait...", threadID, messageID);

        // Upload image to imgur using Kaiz API
        const imgurUpload = await axios.get(
            `https://kaiz-apis.gleeze.com/api/imgur?url=${encodeURIComponent(imageUrl)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`
        );

        const imgurUrl = imgurUpload.data.response;
        if (!imgurUrl || !imgurUrl.startsWith("http")) {
            throw new Error("Imgur upload failed.");
        }

        // Call the Kaiz Zombie API
        const zombieApi = await axios.get(
            `https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imgurUrl)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`
        );

        const zombieImageUrl = zombieApi.data.response;

        const imageBuffer = (await axios.get(zombieImageUrl, { responseType: "arraybuffer" })).data;
        const imgPath = path.join(__dirname, "cache", `zombie_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, imageBuffer);

        return api.sendMessage({ attachment: fs.createReadStream(imgPath) }, threadID, () => {
            fs.unlinkSync(imgPath);
        }, messageID);

    } catch (err) {
        console.error(err);
        return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
};
