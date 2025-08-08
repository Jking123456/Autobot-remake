const axios = require('axios');

module.exports = {
  config: {
    name: "malupiton", // must match filename
    aliases: ["boss", "bossing", "kupal", "ogag", "aray", "aray ko"],
    version: "1.0",
    author: "GoatBot + pakyubot",
    countDown: 5,
    role: 0,
    shortDescription: "Funny insult from Bossing API",
    longDescription: "Sends a funny response from MarkDevs Bossing API when triggered",
    category: "fun",
    guide: {
      en: "{pn} <text> — Get a Bossing-style response\nTriggers automatically when message contains: boss, bossing, kupal, ogag, malupiton, aray ko"
    }
  },

  onStart: async function({ message, args }) {
    try {
      const prompt = encodeURIComponent(args.join(" ") || "");
      const url = `https://markdevs-last-api-p2y6.onrender.com/bossing?prompt=${prompt}&uid=1`;

      const res = await axios.get(url);
      if (res.data?.status) {
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
        if (res.data?.status) {
          message.reply(res.data.response);
        } else {
          message.reply("❌ Wala akong nakuha kay Bossing.");
        }
      } catch (e) {
        message.reply("⚠️ Error: " + e.message);
      }
    }
  }
};    if (triggers.some(word => body.includes(word))) {
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
