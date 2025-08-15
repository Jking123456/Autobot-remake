const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map();

module.exports.config = {
  name: "ai",
  version: "3.1.1",
  permission: 0,
  credits: "Homer Rebatis (Stealth + Style Switch + Humanizer API)",
  description: "Stealth AI reply with human-like typing, style switching, and humanizer API.",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: "ai <question> or reply to an image with your question",
  cooldowns: 0
};

// Typing messages
const typingMessages = [
  "💭 Thinking...",
  "⏳ Just a sec...",
  "🤔 Processing...",
  "💬 Typing...",
  "📡 Connecting..."
];

// Rotate user agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Mozilla/5.0 (Linux; Android 10)",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
];

// Human-like typing delay
function randomTypingIndicator(api, threadID) {
  const msg = typingMessages[Math.floor(Math.random() * typingMessages.length)];
  return new Promise(resolve => {
    setTimeout(() => {
      api.sendMessage(msg, threadID, (err, info) => {
        if (err) return;
        resolve(info.messageID);
      });
    }, Math.floor(Math.random() * 2000) + 500);
  });
}

// Style switcher
function formatWithStyle(text) {
  const styles = [
    () => `Here’s what I found:\n\n${text}`, // Formal
    () => `Oh hey! So basically, ${text.toLowerCase()}`, // Casual
    () => `✨ ${text} ✨`, // Emoji-rich
    () => `📌 Quick breakdown:\n- ${text.replace(/\. /g, "\n- ")}`, // Bullet points
    () => `${text.split(".")[0]}.` // Short & Snappy
  ];
  return styles[Math.floor(Math.random() * styles.length)]();
}

// Humanizer API call
async function humanizeResponse(text) {
  try {
    const res = await axios.get(
      `https://kaiz-apis.gleeze.com/api/humanizer?q=${encodeURIComponent(text)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`,
      { timeout: 15000 }
    );
    return res?.data?.response || text;
  } catch {
    return text; // Fallback to original if API fails
  }
}

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body && !(messageReply && messageReply.attachments.length > 0)) return;

  let botID;
  try { botID = api.getCurrentUserID(); } catch { return; }
  if (senderID === botID) return;
  if (messageReply && messageReply.senderID === botID) return;

  const trimmed = (body || "").trim();
  const lowerTrimmed = trimmed.toLowerCase();

  const repliedImage = messageReply && messageReply.attachments.length > 0 && messageReply.attachments[0].type === "photo";

  if (lowerTrimmed === "ai" || (repliedImage && !trimmed)) {
    return api.sendMessage(
      "🤖 To trigger Assistant:\n" +
      "• Text: `ai <question>`\n   Example: `ai who is the god of sea`\n" +
      "• Image: Reply to an image and type `ai <your question>`\n   Example: (reply to a dog picture) `ai what breed is this?`",
      threadID,
      messageID
    );
  }

  if (!lowerTrimmed.startsWith("ai ") && !repliedImage) return;

  let question = trimmed.substring(3).trim();
  let imageUrl = null;

  if (repliedImage) {
    const attachment = messageReply.attachments[0];
    if (attachment.url) {
      imageUrl = attachment.url;
      if (!question) question = "What's in this image?";
    }
  }

  if (!question && !imageUrl) return;

  const now = Date.now();
  const cooldownTime = 120000;
  if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
    const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
    return api.sendMessage(`⏳ Please wait ${timeLeft}s before asking again.`, threadID, messageID);
  }
  textCooldowns.set(senderID, now);

  const TEXT_API = "https://markdevs-last-api-p2y6.onrender.com/metav2";
  const IMAGE_API = "https://kaiz-apis.gleeze.com/api/gemini-vision";
  const IMAGE_API_KEY = "25644cdb-f51e-43f1-894a-ec718918e649";
  const UID = Math.floor(Math.random() * 1000000).toString();
  const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

  try {
    const tempMsg = await randomTypingIndicator(api, threadID);

    let result;
    if (imageUrl) {
      const params = new URLSearchParams({
        q: question,
        uid: UID,
        imageUrl: imageUrl,
        apikey: IMAGE_API_KEY
      });
      const res = await axios.get(`${IMAGE_API}?${params.toString()}`, {
        headers: { "User-Agent": randomUA },
        timeout: 20000
      });
      result = res?.data?.response || "⚠️ No response from assistant.";
    } else {
      // New TEXT API request
      const params = new URLSearchParams({
        prompt: question,
        uid: UID
      });
      const res = await axios.get(`${TEXT_API}?${params.toString()}`, {
        headers: { "User-Agent": randomUA },
        timeout: 20000
      });

      if (res?.data?.status) {
        result = res.data.response || "⚠️ No response from assistant.";
      } else {
        result = "⚠️ AI failed to respond.";
      }
    }

    // Pass AI result through humanizer API
    const humanized = await humanizeResponse(result);

    // Apply random style
    const styledOutput = formatWithStyle(humanized);

    api.editMessage(
      `•| 𝙰𝚂𝚂𝙸𝚂𝚃𝙰𝙽𝚃 |•\n\n${styledOutput}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙰𝙽𝙾𝙽𝚈𝙼𝙾𝚄𝚂 𝙶𝚄𝚈 |•`,
      tempMsg
    );

  } catch (error) {
    console.error("❌ AI Error:", error?.response?.data || error.message || error);
    api.sendMessage("❌ Error processing your request. Try again later.", threadID, messageID);
  }
};

module.exports.run = () => {};
