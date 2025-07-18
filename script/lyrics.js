const axios = require("axios");

module.exports.config = {
  name: "lyrics",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Get lyrics of a song by title.",
  commandCategory: "music",
  usages: "lyrics [song title]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const title = args.join(" ");
  if (!title)
    return api.sendMessage("❗ Please provide a song title.\n\nUsage: lyrics [song title]", event.threadID, event.messageID);

  try {
    const res = await axios.get(`https://betadash-api-swordslush.vercel.app/lyrics-finder?title=${encodeURIComponent(title)}`);
    const data = res.data;

    if (res.status !== 200 || data.status !== 200 || !data.response)
      return api.sendMessage("❌ Couldn't find lyrics for that song. Try another one.", event.threadID, event.messageID);

    const {
      Title,
      Thumbnail,
      response,
      author
    } = data;

    const message = 
`🎶 Lyrics Found!

📌 Title: ${Title}
👤 Author: ${author}

${response}`;

    const image = await axios.get(Thumbnail, { responseType: "stream" });

    return api.sendMessage({
      body: message,
      attachment: image.data
    }, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("⚠️ Error fetching lyrics. Try again later.", event.threadID, event.messageID);
  }
};
