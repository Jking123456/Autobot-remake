const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "dalle",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Aligno + ChatGPT",
  description: "Edit or generate images using DALL·E",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[prompt] (attach photo to edit, or no photo = generate new)",
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // put your key in env

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, attachments } = event;
  const prompt = args.join(" ") || "Make a funny meme";

  try {
    api.setMessageReaction("⌛", messageID, () => {}, true);

    let url;
    if (attachments.length > 0 && attachments[0].type === "photo") {
      // --- EDIT MODE ---
      const imageUrl = attachments[0].url;

      // download the photo first
      const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync("input.png", Buffer.from(img.data));

      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("image", fs.createReadStream("input.png"));
      form.append("prompt", prompt);
      form.append("size", "1024x1024");

      const response = await axios.post(
        "https://api.openai.com/v1/images/edits",
        form,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            ...form.getHeaders(),
          },
        }
      );

      const base64 = response.data.data[0].b64_json;
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync("edited.png", buffer);
      url = "edited.png";
    } else {
      // --- GENERATION MODE ---
      const response = await axios.post(
        "https://api.openai.com/v1/images/generations",
        {
          model: "gpt-image-1",
          prompt: prompt,
          size: "1024x1024",
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      const base64 = response.data.data[0].b64_json;
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync("generated.png", buffer);
      url = "generated.png";
    }

    api.sendMessage(
      {
        body: `✨ DALL·E result for: "${prompt}"`,
        attachment: fs.createReadStream(url),
      },
      threadID,
      messageID
    );

    api.setMessageReaction("🟢", messageID, () => {}, true);
  } catch (err) {
    console.error(err.response?.data || err.message);
    api.sendMessage("❌ Error while using DALL·E API.", threadID, messageID);
    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
