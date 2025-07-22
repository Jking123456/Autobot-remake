const axios = require("axios");

module.exports.config = {
  name: "tikstalk",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Get TikTok user profile information by username.",
  commandCategory: "tools",
  usages: "tikstalk [username]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // ✅ Bot admin restriction
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();

    if (threadInfo.isGroup) {
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
      if (!isBotAdmin) {
        return api.sendMessage("🚫 This command can only be used if the bot is an admin in this group.", threadID, messageID);
      }
    }
  } catch (err) {
    console.error("Admin check failed:", err);
    return api.sendMessage("⚠️ Could not verify admin status. Try again later.", threadID, messageID);
  }

  try {
    const username = args.join("").trim();
    if (!username)
      return api.sendMessage("❗ Please provide a TikTok username.\n\nUsage: tikstalk [username]", threadID, messageID);

    const res = await axios.get(`https://betadash-search-download.vercel.app/tikstalk?username=${encodeURIComponent(username)}`);
    const data = res.data;

    if (!data.username) {
      return api.sendMessage("❌ User not found or API returned an invalid response.", threadID, messageID);
    }

    const {
      nickname,
      username: user,
      avatarLarger,
      signature,
      followerCount,
      followingCount,
      heartCount,
      videoCount,
      diggCount
    } = data;

    const info = 
`🎵 TikTok User Info

👤 Name: ${nickname}
🔤 Username: @${user}
📝 Bio: ${signature || "No bio provided"}

📊 Followers: ${followerCount}
📈 Following: ${followingCount}
❤️ Hearts: ${heartCount}
🎬 Videos: ${videoCount}
👍 Total Likes: ${diggCount}`;

    const imgStream = await axios.get(avatarLarger, { responseType: "stream" });
    return api.sendMessage({
      body: info,
      attachment: imgStream.data
    }, threadID, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error fetching TikTok data. Please try again later.", threadID, messageID);
  }
};
