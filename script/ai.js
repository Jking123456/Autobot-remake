const axios = require("axios");

module.exports.config = {
  name: "mention-ai",
  version: "1.0.3",
  role: 0,
  hasPrefix: false,
  description: "AI Chatbot with Vision (triggered when bot is mentioned)",
  usage: "@Bot [question] or reply to an image with @Bot + prompt",
  credits: "Vern + Modified by ChatGPT",
  cooldown: 3,
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, mentions, messageReply } = event;

  // Only run if bot is mentioned
  if (!mentions || !mentions[api.getCurrentUserID()]) return;

  const promptText = body.replace(/@\S+/g, "").trim();
  const userReply = messageReply?.body || "";
  const finalPrompt = `${userReply} ${promptText}`.trim();

  const attachment = messageReply?.attachments?.[0];
  const isImage = attachment?.type === "photo";

  if (!finalPrompt && !isImage) {
    return api.sendMessage(
      "❌ Please provide a prompt or reply to an image with a mention.",
      threadID,
      messageID
    );
  }

  api.sendMessage(
    "🤖 𝗔𝗜 𝗜𝗦 𝗣𝗥𝗢𝗖𝗘𝗦𝗦𝗜𝗡𝗚 𝗬𝗢𝗨𝗥 𝗥𝗘𝗤𝗨𝗘𝗦𝗧...",
    threadID,
    async (err, info) => {
      if (err) return;

      try {
        let responseText = "";

        if (isImage) {
          // --- Vision API via GET
          const { data } = await axios.get(
            "https://daikyu-api.up.railway.app/api/gemini-vision",
            {
              params: {
                ask: finalPrompt || "Analyze this image",
                imageURL: attachment.url,
              },
            }
          );

          responseText =
            data.reply || data.description || "❌ No response from AI.";
        } else {
          // --- Chatbot API
          const { data } = await axios.get(
            "https://kaiz-apis.gleeze.com/api/llama3-turbo",
            {
              params: {
                ask: finalPrompt,
                uid: senderID,
                apikey: "25644cdb-f51e-43f1-894a-ec718918e649",
              },
            }
          );
          responseText = data.response || "❌ No response from AI.";
        }

        // --- Add user info
        api.getUserInfo(senderID, (err, infoUser) => {
          const userName = infoUser?.[senderID]?.name || "Unknown User";
          const timePH = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Manila",
          });
          const replyMessage = `🤖 𝗔𝗜 𝗔𝗦𝗦𝗜𝗦𝗧𝗔𝗡𝗧\n━━━━━━━━━━━━━━━━━━\n${responseText}\n━━━━━━━━━━━━━━━━━━\n🗣 𝗔𝘀𝗸𝗲𝗱 𝗕𝘆: ${userName}\n⏰ 𝗧𝗶𝗺𝗲: ${timePH}`;

          api.editMessage(replyMessage, info.messageID);
        });
      } catch (error) {
        console.error("AI Error:", error);
        const errMsg =
          "❌ Error: " +
          (error.response?.data?.message ||
            error.message ||
            "Unknown error occurred.");
        api.editMessage(errMsg, info.messageID);
      }
    }
  );
};
