const axios = require("axios");

module.exports.config = {
    name: "youtube",
    version: "1.0.1",
    role: 0,
    hasPrefix: false,
    aliases: ["ytsearch", "yt"],
    description: "Search YouTube videos",
    usage: "youtube <search query>",
    credits: "Homer Rebatis"
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, isGroup } = event;

    if (!args[0]) {
        return api.sendMessage("⚠️ Please provide a search query.", threadID, messageID);
    }

    let botID;
    try {
        botID = api.getCurrentUserID();
    } catch (err) {
        console.warn("⚠️ Couldn't fetch bot ID:", err);
        return;
    }

    // Restrict command usage if bot is not admin
    if (isGroup) {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const botIsAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);
            if (!botIsAdmin) {
                return api.sendMessage(
                    "🚫 𝐋𝐨𝐜𝐤𝐞𝐝 ! To use this command, make the bot an admin in this group.",
                    threadID,
                    messageID
                );
            }
        } catch (err) {
            console.error("⚠️ Error checking admin status:", err);
            return api.sendMessage(
                "⚠️ Couldn't verify admin status. Please try again.",
                threadID,
                messageID
            );
        }
    }

    const query = encodeURIComponent(args.join(" "));

    // Send "searching" message first
    api.sendMessage("🔍 Searching on YouTube...", threadID, async (err, info) => {
        if (err) return;

        try {
            const res = await axios.get(`https://wrapped-rest-apis.vercel.app/api/ytsearch?query=${query}`);
            const data = res.data.data;

            if (!data || data.length === 0) {
                return api.editMessage("❌ No results found.", info.messageID);
            }

            // Pick a random video from the results
            const randomVideo = data[Math.floor(Math.random() * data.length)];

            const resultMessage =
                `🎬 Title: ${randomVideo.title}\n` +
                `⏱ Duration: ${randomVideo.duration}\n` +
                `👁 Views: ${randomVideo.views}\n` +
                `📎 Link: ${randomVideo.url}\n\n` +
                `${randomVideo.imgSrc}`;

            // Edit the "searching" message with the result
            api.editMessage(resultMessage, info.messageID);

        } catch (err) {
            console.error(err);
            api.editMessage("❌ Error fetching YouTube data.", info.messageID);
        }
    });
};
