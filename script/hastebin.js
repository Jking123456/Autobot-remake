const axios = require("axios");

module.exports.config = {
    name: "hastebin",
    version: "1.3",
    author: "Pedro Pendoko",
    countDown: 5,
    role: 0,
    shortDescription: "Upload text/code to Hastebin",
    longDescription: "Upload up to 1000+ characters of text or code to Hastebin with preserved formatting",
    category: "utility",
    guide: "{p}hastebin <text/code> or reply to a message with {p}hastebin"
};

module.exports.run = async function({ api, event, args }) {
    let content = "";

    // If command used by replying to a message
    if (event.type === "message_reply" && event.messageReply?.body) {
        content = event.messageReply.body;
    }
    // If text is provided directly after the command
    else if (args.length > 0) {
        content = args.join(" ");
    }
    // If nothing is provided
    else {
        return api.sendMessage("❌ Please provide some text or reply to a message to upload.", event.threadID, event.messageID);
    }

    try {
        const encodedText = encodeURIComponent(content);
        const res = await axios.get(
            `https://betadash-api-swordslush.vercel.app/hastebin?upload=${encodedText}`,
            { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }
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
