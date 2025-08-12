const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map();

module.exports.config = {
  name: "ai",
  version: "1.1.1",
  permission: 0,
  credits: "Homer Rebatis + ChatGPT",
  description: "Auto AI reply with typing indicator, supports text and image triggers.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "End message with '.' or '?' or reply to an image",
  cooldowns: 0
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body || typeof body !== "string") return;

  let botID;
  try { botID = api.getCurrentUserID(); } catch { return; }
  if (senderID === botID) return;
  if (messageReply && messageReply.senderID === botID) return;

  const trimmed = body.trim().toLowerCase();

  // 📌 Send notice if user types "ai"
  if (trimmed === "ai") {
    return api.sendMessage(
      "🤖 To trigger AI:\n• End your message with `.` or `?`\n• Or reply to an image with your question.\nExample: `What is HTML?` or reply to a photo with `Describe this.`",
      threadID,
      messageID
    );
  }

  const endsWithTrigger = /[.?]$/.test(trimmed);

  let imageUrl = null;
  if (messageReply && messageReply.attachments.length > 0) {
    const attachment = messageReply.attachments[0];
    if (attachment.type === "photo" && attachment.url) {
      imageUrl = attachment.url;
    }
  }
  if (!endsWithTrigger && !imageUrl) return;

  const now = Date.now();
  const cooldownTime = 10000;
  if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft}s before asking again.`, threadID, messageID);
  }
  textCooldowns.set(senderID, now);

  const TEXT_API = "https://betadash-api-swordslush.vercel.app/gpt4";
  const IMAGE_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
  const IMAGE_API_KEY = "25644cdb-f51e-43f1-894a-ec718918e649";
  const UID = Math.floor(Math.random() * 1000000).toString();

  try {
    // Step 1: Send "typing" message
    const tempMsg = await new Promise(resolve => {
      api.sendMessage("💬 Typing...", threadID, (err, info) => {
        if (err) return;
        resolve(info.messageID);
      });
    });

    let result;
    if (imageUrl) {
      const params = new URLSearchParams({
        q: trimmed || "What’s in this image?",
        uid: UID,
        imageUrl: imageUrl,
        apikey: IMAGE_API_KEY
      });
      const res = await axios.get(`${IMAGE_API}?${params.toString()}`, { timeout: 20000 });
      result = res?.data?.response || "⚠️ No response from image AI.";
    } else {
      const res = await axios.get(`${TEXT_API}?ask=${encodeURIComponent(trimmed)}`, { timeout: 20000 });
      result = res?.data?.content || "⚠️ No response from text AI.";
    }

    // Step 2: Edit the typing message into the AI's response
    api.editMessage(
      `•| 𝙰𝚂𝚂𝙸𝚂𝚃𝙰𝙽𝚃 - 𝙰𝙸 |•\n\n${result}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙰𝙽𝙾𝙽𝚈𝙼𝙾𝚄𝚂 𝙶𝚄𝚈 |•`,
      tempMsg
    );

  } catch (error) {
    console.error("❌ AI Error:", error?.response?.data || error.message || error);
    api.sendMessage("❌ Error processing your request. Try again later.", threadID, messageID);
  }
};

module.exports.run = () => {};
