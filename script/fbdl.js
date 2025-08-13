const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
    name: "fbdl",
    version: "1.1",
    author: "Homer Rebatis",
    cooldown: 5,
    description: "Download Facebook videos and send as attachment or link if too large",
    usage: "fbdl <Facebook video URL>"
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    if (!args[0]) {
        return api.sendMessage("❌ Please provide a Facebook video URL.\nUsage: fbdl <URL>", threadID, messageID);
    }

    const videoUrl = args[0];
    const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
    const apiLink = `https://kaiz-apis.gleeze.com/api/fbdl-v2?url=${encodeURIComponent(videoUrl)}&apikey=${apiKey}`;

    // Send typing indicator
    api.sendTyping(threadID, true);

    try {
        const response = await axios.get(apiLink);
        const data = response.data;

        if (!data.download_url) {
            return api.sendMessage("❌ Failed to get the video. Please check the URL.", threadID, messageID);
        }

        // Check file size first using HEAD request
        const head = await axios.head(data.download_url);
        const fileSize = head.headers['content-length']; // in bytes
        const maxSize = 25 * 1024 * 1024; // 25MB Messenger limit

        if (fileSize > maxSize) {
            // Send direct link instead if video is too large
            return api.sendMessage(
                `⚠️ Video is too large to send in chat.\nAuthor: ${data.author}\nDirect Download Link:\n${data.download_url}`,
                threadID,
                messageID
            );
        }

        // Download the video temporarily
        const videoPath = path.join(__dirname, "temp_video.mp4");
        const videoResponse = await axios({
            method: "GET",
            url: data.download_url,
            responseType: "stream"
        });

        const writer = fs.createWriteStream(videoPath);
        videoResponse.data.pipe(writer);

        writer.on("finish", () => {
            api.sendMessage({
                body: `🎬 Facebook Video Download\nAuthor: ${data.author}`,
                attachment: fs.createReadStream(videoPath)
            }, threadID, () => {
                fs.unlinkSync(videoPath); // Delete temp file
            }, messageID);
        });

        writer.on("error", (err) => {
            console.error(err);
            api.sendMessage("❌ Error sending video.", threadID, messageID);
        });

    } catch (error) {
        console.error(error);
        api.sendMessage("❌ An error occurred while processing the video.", threadID, messageID);
    } finally {
        api.sendTyping(threadID, false);
    }
};
