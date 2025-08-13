const axios = require("axios");

module.exports.config = {
    name: "hastebin",
    version: "1.2",
    author: "Homer Rebatis",
    countDown: 5,
    role: 0,
    shortDescription: "Upload text/code to Hastebin",
    longDescription: "Upload up to 1000+ characters of text or code to Hastebin with preserved formatting",
    category: "utility",
    guide: "{p}hastebin <text/code>"
};

module.exports.run = async function({ api, event }) {
    // Get the message exactly as sent, preserving newlines
    const prefix = global.GoatBot.config.prefix;
    const commandName = this.config.name;
    const content = event.body.slice(prefix.length + commandName.length + 1);

    if (!content.trim()) {
        return api.sendMessage("❌ Please provide some text or code to upload.", event.threadID, event.messageID);
    }

    try {
        // Encode but keep newlines intact
        const encodedText = encodeURIComponent(content);
        const res = await axios.get(
            `https://betadash-api-swordslush.vercel.app/hastebin?upload=${encodedText}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                }
            }
        );

        if (res.data && res.data.status === "200") {
            return api.sendMessage(
                `✅ Document uploaded successfully by ${res.data.author || "unknown"}\n📄 View: ${res.data.skyra}\n📜 Raw: ${res.data.raw}`,
                event.threadID,
                event.messageID
            );
        } else {
            return api.sendMessage("⚠️ Failed to upload document.", event.threadID, event.messageID);
        }
    } catch (error) {
        return api.sendMessage(`❌ Error: ${error.response?.status || error.message}`, event.threadID, event.messageID);
    }
};
