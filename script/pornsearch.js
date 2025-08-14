const axios = require("axios");

// Global toggle (owner can still turn on/off for themselves)
let commandEnabled = true;

// Owner UID
const OWNER_UID = "100044848836284";

module.exports.config = {
  name: "pornsearch",
  version: "1.0.3",
  hasPermssion: 0,
  credits: "Homer Rebatis + Updated by ChatGPT",
  description: "Search random Pornhub video from a search term",
  commandCategory: "adult",
  usages: "[search term] | on/off",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // Restrict command to OWNER_UID only
  if (senderID !== OWNER_UID) {
    return api.sendMessage("🚫 This command is only available to the bot owner.", threadID, messageID);
  }

  // Owner control: on/off toggle
  if (args.length === 1 && ["on", "off"].includes(args[0].toLowerCase())) {
    commandEnabled = args[0].toLowerCase() === "on";
    return api.sendMessage(
      `✅ Pornsearch command is now ${commandEnabled ? "ENABLED" : "DISABLED"} for the owner.`,
      threadID,
      messageID
    );
  }

  // Check if command is disabled
  if (!commandEnabled) {
    return api.sendMessage(
      "🚫 This command is currently disabled by the owner.",
      threadID,
      messageID
    );
  }

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.isGroup) {
      return api.sendMessage("❌ This command can only be used in groups.", threadID, messageID);
    }

    const botID = api.getCurrentUserID();
    const isBotAdmin = threadInfo.adminIDs.some(e => e.id == botID);
    if (!isBotAdmin) {
      return api.sendMessage("🚫 Locked! To use this command, make the bot admin in this group.", threadID, messageID);
    }

    const query = args.join(" ");
    if (!query) {
      return api.sendMessage("🔍 Usage: pornsearch <search term>", threadID, messageID);
    }

    // Searching message
    api.sendMessage(`🔎 Searching for "${query}"...`, threadID, async (err, info) => {
      if (err) return;
      const searchingMsgID = info.messageID;

      try {
        const res = await axios.get(`https://markdevs-last-api-p2y6.onrender.com/pornhubsearch?search=${encodeURIComponent(query)}`);
        const videos = res.data.videos;

        if (!videos || videos.length === 0) {
          return api.editMessage(`❌ No results found for "${query}".`, searchingMsgID);
        }

        // Pick random video
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        const msg = `🔞 Random Pornhub Video Result:\n\n` +
                    `🎬 Title: ${randomVideo.title}\n` +
                    `🔗 Link: ${randomVideo.link}\n` +
                    `🖼 Thumbnail: ${randomVideo.thumbnail}`;

        api.editMessage(msg, searchingMsgID);
      } catch (error) {
        console.error(error);
        api.editMessage("❌ Error fetching results. Please try again later.", searchingMsgID);
      }
    });

  } catch (e) {
    console.error(e);
    api.sendMessage("❌ An error occurred.", threadID, messageID);
  }
};
