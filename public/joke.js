const axios = require("axios");

module.exports.config = {
    name: "joke",
    version: "1.0.1",
    role: 0,
    hasPrefix: false,
    aliases: ["funny", "lol"],
    description: "Get a random joke",
    usage: "joke",
    credits: "Homer Rebatis"
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, senderID, isGroup } = event;

    try {
        let botID = api.getCurrentUserID();

        // ✅ Restrict if bot is not admin in group
        if (isGroup) {
            const threadInfo = await api.getThreadInfo(threadID);
            const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);
            if (!botIsAdmin) {
                return api.sendMessage(
                    "🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! 𝐓𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬, 𝐦𝐚𝐤𝐞 𝐭𝐡𝐞 𝐛𝐨𝐭 𝐚𝐝𝐦𝐢𝐧 𝐢𝐧 𝐭𝐡𝐢𝐬 𝐠𝐫𝐨𝐮𝐩.",
                    threadID,
                    messageID
                );
            }
        }

        // Typing indicator
        api.sendTypingIndicator(threadID);

        // Fetch joke from API
        const res = await axios.get("https://rapido.zetsu.xyz/api/joke");
        const joke = res.data?.joke || "😂 No joke found.";

        return api.sendMessage(`🤣 ${joke}`, threadID, messageID);

    } catch (err) {
        console.error("❌ Joke API Error:", err.message || err);
        return api.sendMessage("❌ Couldn't fetch a joke right now, try again later.", threadID, messageID);
    }
};
