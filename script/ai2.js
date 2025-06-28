const axios = require("axios");

module.exports = {
    name: "ai2",
    usePrefix: false,
    usage: "ai <your question> | <reply to an image>",
    version: "1.2",
    admin: false,
    cooldown: 2,

    execute: async ({ api, event, args }) => {
        try {
            const { threadID } = event;
            let prompt = args.join(" ");
            let imageUrl = null;
            let apiUrl = `https://apis-rho-nine.vercel.app/gemini?ask=${encodeURIComponent(prompt)}`;

            if (event.messageReply && event.messageReply.attachments.length > 0) {
                const attachment = event.messageReply.attachments[0];
                if (attachment.type === "photo") {
                    imageUrl = attachment.url;
                    apiUrl += `&imagurl=${encodeURIComponent(imageUrl)}`;
                }
            }

            const loadingMsg = await api.sendMessage("🧠 Homer AI Bot is thinking...", threadID);

            const response = await axios.get(apiUrl);
            const description = response?.data?.data?.description;

            if (description) {
                return api.sendMessage(`•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃 |•\n\n${description}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`, threadID, loadingMsg.messageID);
            }

            return api.sendMessage("⚠️ No description found in response.", threadID, loadingMsg.messageID);
        } catch (error) {
            console.error("❌ Gemini Error:", error);
            return api.sendMessage("❌ Error while contacting Gemini API.", event.threadID);
        }
    }
};
