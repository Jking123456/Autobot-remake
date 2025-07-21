const axios = require("axios");

module.exports.config = {
  name: "uidgetter",
  version: "1.0.0",
  hasPrefix: true,
  permission: 0,
  credits: "Homer Rebatis",
  description: "Fetch Facebook UID from a profile URL.",
  commandCategory: "tools",
  usages: "uidgetter [fb_profile_url]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const url = args.join(" ").trim();
  if (!url)
    return api.sendMessage("📎 Please provide a Facebook profile URL.\n\nUsage: uidgetter [url]", event.threadID, event.messageID);

  const apiKey = "25644cdb-f51e-43f1-894a-ec718918e649";
  const apiUrl = `https://kaiz-apis.gleeze.com/api/fbuid?url=${encodeURIComponent(url)}&apikey=${apiKey}`;

  try {
    const res = await axios.get(apiUrl);
    const data = res.data;

    if (!data || !data.UID) {
      return api.sendMessage("❌ UID not found or invalid URL.", event.threadID, event.messageID);
    }

    return api.sendMessage(`🔍 UID: ${data.UID}`, event.threadID, event.messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("⚠️ Error retrieving UID. Please try again later.", event.threadID, event.messageID);
  }
};
