const axios = require('axios');

module.exports = {
  config: {
    name: "malupiton",
    aliases: ["boss", "bossing", "kupal", "ogag", "malupiton", "aray", "aray ko"],
    version: "1.0",
    author: "Homer Rebatis",
    countDown: 5,
    role: 0,
    shortDescription: "MarkDevs Bossing API",
    longDescription: "Triggers funny insult from MarkDevs Bossing API",
    category: "fun",
    guide: "{pn} [text]"
  },

  onStart: async function({ message, args }) {
    try {
      const prompt = encodeURIComponent(args.join(" ") || "");
      const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;

      const res = await axios.get(url);
      if (res.data && res.data.status) {
        message.reply(res.data.response);
      } else {
        message.reply("❌ Wala akong nakuha kay Bossing.");
      }
    } catch (e) {
      message.reply("⚠️ Error: " + e.message);
    }
  },

  onChat: async function({ message, event }) {
    const triggers = ["boss", "bossing", "kupal", "ogag", "malupiton", "aray ko"];
    const body = event.body?.toLowerCase() || "";

    if (triggers.some(word => body.includes(word))) {
      try {
        const prompt = encodeURIComponent(body);
        const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;

        const res = await axios.get(url);
        if (res.data && res.data.status) {
          message.reply(res.data.response);
        } else {
          message.reply("❌ Wala akong nakuha kay Bossing.");
        }
      } catch (e) {
        message.reply("⚠️ Error: " + e.message);
      }
    }
  }
};
