const axios = require("axios");

// ========== CONFIG ==========
module.exports.config = {
  name: "mentionAI",
  version: "1.2.0",
  role: 0,
  hasPrefix: false,
  aliases: ["gpt", "vision"],
  description: "AI Assistant (text + image vision) triggered by mentioning the bot",
  usage: "@Bot [your question] or reply to an image with mention + prompt",
  credits: "Aligno + ChatGPT",
  cooldown: 3,
};

// ========== HELPERS ==========

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random User-Agent pool
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.134 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0"
];

// Extra headers pool
const extraHeaders = [
  { "Accept-Language": "en-US,en;q=0.9" },
  { "Cache-Control": "no-cache" },
  { "Pragma": "no-cache" },
  { "Accept-Encoding": "gzip, deflate, br" },
  { "Connection": "keep-alive" }
];

// Combine UA + random header
function getAxiosConfig() {
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
  const header = extraHeaders[Math.floor(Math.random() * extraHeaders.length)];
  return { headers: { "User-Agent": ua, ...header } };
}

// ========== MAIN HANDLER ==========
module.exports.handleEvent = async function ({ api, event }) {
  const botID = api.getCurrentUserID();
  if (!event.body || !event.mentions || !event.mentions[botID]) return;

  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  const promptText = event.body.replace(/@\S+/g, "").trim();
  const userReply = event.messageReply?.body || "";
  const finalPrompt = `${userReply} ${promptText}`.trim();

  if (!finalPrompt && !event.messageReply?.attachments?.[0]?.url) {
    return api.sendMessage("❌ Please provide a prompt or reply to an image with a question.", threadID, messageID);
  }

  api.sendMessage("🤖 𝗔𝗜 𝗜𝗦 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗬𝗢𝗨𝗥 𝗥𝗘𝗤𝗨𝗘𝗦𝗧...", threadID, async (err, info) => {
    if (err) return;

    try {
      // Add random delay (5–7s)
      await delay(Math.floor(Math.random() * 2000) + 5000);

      let responseText = "";
      let imageUrl = "";

      // --- If replying to an image ---
      if (event.messageReply?.attachments?.[0]?.type === "photo") {
        imageUrl = event.messageReply.attachments[0].url;

        const { data } = await axios.get("https://daikyu-api.up.railway.app/api/gemini-vision", {
          params: {
            ask: finalPrompt || "Analyze this image",
            imageURL: imageUrl
          },
          ...getAxiosConfig()
        });

        responseText = data.reply || "❌ No description generated.";
      }

      // --- If no image, use text model ---
      if (!imageUrl) {
        const { data } = await axios.get("https://kaiz-apis.gleeze.com/api/llama3-turbo", {
          params: {
            ask: finalPrompt,
            uid: senderID,
            apikey: "25644cdb-f51e-43f1-894a-ec718918e649"
          },
          ...getAxiosConfig()
        });

        responseText = data.response || "❌ No response received from AI.";
      }

      // Fetch user info
      api.getUserInfo(senderID, (err, infoUser) => {
        const userName = infoUser?.[senderID]?.name || "Unknown User";
        const timePH = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
        const replyMessage =
          `🤖 𝗔𝗜 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧\n━━━━━━━━━━━━━━━━━━\n${responseText}\n━━━━━━━━━━━━━━━━━━\n🗣 𝗔𝘀𝗸𝗲𝗱 𝗕𝘆: ${userName}\n⏰ 𝗧𝗶𝗺𝗲: ${timePH}`;

        api.editMessage(replyMessage, info.messageID);
      });
    } catch (error) {
      console.error("AI Error:", error);
      const errMsg = "❌ Error: " + (error.response?.data?.message || error.message || "Unknown error occurred.");
      api.editMessage(errMsg, info.messageID);
    }
  });
};
