const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "dalle",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Aligno + ChatGPT",
  description: "Generate or edit images using OpenAI DALL·E",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[prompt] (attach photo to edit, or no photo = generate new)",
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // put your key in env

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, attachments } = event;
  const prompt = args.join(" ") || "A cute baby goat";

  try {
    api.setMessageReaction("⌛", messageID, () => {}, true);

    let filePath;
    if (attachments.length > 0 && attachments[0].type === "photo") {
      // --- EDIT MODE ---
      const imageUrl = attachments[0].url;

      // download the user photo
      const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
      fs.writeFileSync("input.png", Buffer.from(img.data));

      const form = new FormData();
      form.append("model", "gpt-image-1");
      form.append("image", fs.createReadStream("input.png"));
      form.append("prompt", prompt);
      form.append("size", "512x512");

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
      filePath = "edited.png";
      fs.writeFileSync(filePath, buffer);
    } else {
      // --- GENERATION MODE ---
      const response = await axios.post(
        "https://api.openai.com/v1/images/generations",
        {
          model: "gpt-image-1",
          prompt: prompt,
          size: "512x512",
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const base64 = response.data.data[0].b64_json;
      const buffer = Buffer.from(base64, "base64");
      filePath = "generated.png";
      fs.writeFileSync(filePath, buffer);
    }

    // Send back to Messenger
    api.sendMessage(
      {
        body: `✨ DALL·E result for: "${prompt}"`,
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      () => {
        api.setMessageReaction("🟢", messageID, () => {}, true);
        fs.unlinkSync(filePath); // cleanup temp file
        if (fs.existsSync("input.png")) fs.unlinkSync("input.png");
      },
      messageID
    );
  } catch (err) {
    console.error("DALL·E error:", err.response?.data || err.message);

    api.sendMessage(
      "❌ DALL·E request failed.\n\n" +
        (err.response?.data?.error?.message || err.message),
      threadID,
      messageID
    );

    api.setMessageReaction("❌", messageID, () => {}, true);
  }
};
