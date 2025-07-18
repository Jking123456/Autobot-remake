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
  try {
    const username = args.join("").trim();
    if (!username)
      return api.sendMessage("❗ Please provide a TikTok username.\n\nUsage: tikstalk [username]", event.threadID, event.messageID);

    const res = await axios.get(`https://betadash-search-download.vercel.app/tikstalk?username=${encodeURIComponent(username)}`);
    const data = res.data;

    if (!data.username) {
      return api.sendMessage("❌ User not found or API returned an invalid response.", event.threadID, event.messageID);
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

    // Send avatar first, then profile info
    const imgStream = await axios.get(avatarLarger, { responseType: "stream" });
    return api.sendMessage({
      body: info,
      attachment: imgStream.data
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ Error fetching TikTok data. Please try again later.", event.threadID, event.messageID);
  }
};
