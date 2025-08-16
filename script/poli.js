const axios = require("axios");

module.exports = {
  config: {
    name: "poli",
    aliases: ["aiimage", "polli"],
    version: "1.0",
    author: "YourName",
    countDown: 5,
    role: 0,
    shortDescription: "Generate an AI image",
    longDescription: "Generate an AI image using the Poli (Pollinations) API",
    category: "fun",
    guide: "{pn} <prompt>"
  },

  onStart: async function ({ message, args }) {
    if (args.length === 0) {
      return message.reply("⚠️ Please provide a prompt!\n\nExample: poli devil cat");
    }

    const prompt = encodeURIComponent(args.join(" "));
    const apiKey = "63fafad1-e326-432c-85f6-54b505835e72"; // your key
    const url = `https://kaiz-apis.gleeze.com/api/poli?prompt=${prompt}&apikey=${apiKey}`;

    try {
      const response = await axios.get(url, { responseType: "arraybuffer" });

      await message.reply({
        body: `✨ Generated image for: ${args.join(" ")}`,
        attachment: Buffer.from(response.data, "binary")
      });
    } catch (e) {
      console.error(e);
      return message.reply("❌ Failed to generate image. Please try again later.");
    }
  }
};
