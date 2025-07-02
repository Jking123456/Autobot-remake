module.exports.config = {
    name: "zombie",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Who's Deku (Modified by Homer Rebatis)",
    description: "Apply zombie filter to an image",
    commandCategory: "image",
    usages: "[reply to image or paste image URL]",
    cooldowns: 1,
};

const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    let imageUrl;

    if (event.type === "message_reply" && event.messageReply.attachments.length > 0) {
        imageUrl = event.messageReply.attachments[0].url;
    } else {
        imageUrl = args.join(" ");
    }

    if (!imageUrl || !imageUrl.includes("http")) {
        return api.sendMessage("⚠️ Please reply to an image or provide a valid image URL.", threadID, messageID);
    }

    try {
        api.sendMessage("🧟 Generating zombie filter...", threadID, messageID);

        const apiUrl = `https://kaiz-apis.gleeze.com/api/zombie?url=${encodeURIComponent(imageUrl)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;
        const response = await axios.get(apiUrl);
        const resultUrl = response.data.response;

        const imageRes = await axios.get(resultUrl, { responseType: "arraybuffer" });
        const imagePath = path.join(__dirname, "cache", `zombie_${Date.now()}.png`);
        fs.writeFileSync(imagePath, imageRes.data);

        return api.sendMessage({ attachment: fs.createReadStream(imagePath) }, threadID, () => {
            fs.unlinkSync(imagePath);
        }, messageID);
    } catch (err) {
        console.error(err);
        return api.sendMessage(`❌ Error: ${err.message}`, threadID, messageID);
    }
};
