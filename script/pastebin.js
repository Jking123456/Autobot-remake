const axios = require("axios");

module.exports.config = {
    name: "pastebin",
    version: "1.0",
    author: "Pedro Pendoko",
    countDown: 5,
    role: 0,
    shortDescription: "Create a pastebin link",
    longDescription: "Create a pastebin link from the provided code/text",
    category: "utility",
    guide: "{p}pastebin <code/text>"
};

module.exports.run = async function({ api, event, args }) {
    const content = args.join(" ");
    if (!content) {
        return api.sendMessage("❌ Please provide some code or text to paste.", event.threadID, event.messageID);
    }

    try {
        // Encode content for URL
        const encoded = encodeURIComponent(content);
        const res = await axios.get(`https://rapido.zetsu.xyz/api/pastebin?c=${encoded}`);
        
        if (res.data && res.data.url) {
            return api.sendMessage(
                `✅ Pastebin created by ${res.data.operator || "unknown"}\n📄 Link: ${res.data.url}`,
                event.threadID,
                event.messageID
            );
        } else {
            return api.sendMessage("⚠️ Failed to create pastebin link.", event.threadID, event.messageID);
        }
    } catch (error) {
        return api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
};
