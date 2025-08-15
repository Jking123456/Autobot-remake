const axios = require("axios");

// Cooldown & session storage
const cooldowns = new Map(); // key: `${threadID}_${senderID}`
const sessions = new Map();

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

// ✅ Per-user cooldown check
function isOnCooldown(threadID, senderID, cooldownMs = 5000) {
  const key = `${threadID}_${senderID}`;
  const now = Date.now();
  if (cooldowns.has(key) && now - cooldowns.get(key) < cooldownMs) {
    return true;
  }
  cooldowns.set(key, now);
  return false;
}

// ✅ Human-like typing
function startTyping(api, threadID) {
  api.sendTypingIndicator(threadID, true);
}

function stopTyping(api, threadID) {
  api.sendTypingIndicator(threadID, false);
}

// Random thinking message
function randomThinkingMessage(api, threadID) {
  const msg = typingMessages[Math.floor(Math.random() * typingMessages.length)];
  return new Promise(resolve => {
    api.sendMessage(msg, threadID, (err, info) => {
      if (err) return;
      resolve(info.messageID);
    });
  });
}

// Style switcher (fixed syntax)
function formatWithStyle(text) {
  const styles = [
    () => `Here’s what I found:\n\n${text}`,
    () => `Oh hey! So basically, ${text.toLowerCase()}`,
    () => `✨ ${text} ✨`,
    () => `📌 Quick breakdown:\n- ${text.replace(/\. /g, "\n- ")}`,
    () => `${text.split(".")[0]}.`
  ];
  return styles[Math.floor(Math.random() * styles.length)]();
}

module.exports.config = {
  name: "ai",
  version: "1.1.0",
  permission: 0,
  credits: "Your Name",
  description: "LLaMA AI chat with reply-only mode and image understanding",
  prefix: false,
  category: "without prefix",
  usage: "gpt <question> or reply to an image with your question",
  cooldowns: 0
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body && !(messageReply && messageReply.attachments.length > 0)) return;

  let botID;
  try { botID = api.getCurrentUserID(); } catch { return; }
  if (senderID === botID) return;

  const trimmed = (body || "").trim();
  const lowerTrimmed = trimmed.toLowerCase();
  const repliedImage = messageReply && messageReply.attachments.length > 0 && messageReply.attachments[0].type === "photo";

  const session = sessions.get(threadID) || { lastBotMsgID: null };

  // ✅ Cooldown per user
  if (isOnCooldown(threadID, senderID)) {
    return api.sendMessage("⏳ Please wait 5s before asking again.", threadID, messageID);
  }

  // Reset command
  if (lowerTrimmed === "reset") {
    sessions.delete(threadID);
    return api.sendMessage("✅ Conversation reset. Type ai <question> to start again.", threadID, messageID);
  }

  // If in session → must reply to last bot message
  if (session.lastBotMsgID) {
    const isReply = messageReply && messageReply.messageID === session.lastBotMsgID;
    if (!isReply) return;
    await processQuestion(api, threadID, senderID, trimmed, repliedImage ? messageReply.attachments[0].url : null, session);
    return;
  }

  // Start new session
  if (!lowerTrimmed.startsWith("ai ") && !repliedImage) return;

  let question = trimmed.startsWith("ai ") ? trimmed.slice(3).trim() : "";
  let imageUrl = null;

  if (repliedImage) {
    imageUrl = messageReply.attachments[0].url;
    if (!question) question = "What's in this image?";
  }

  if (!question && !imageUrl) return;

  await processQuestion(api, threadID, senderID, question, imageUrl, session);
};

async function processQuestion(api, threadID, senderID, question, imageUrl, session) {
  startTyping(api, threadID); // Show typing bubble
  const tempMsgID = await randomThinkingMessage(api, threadID);

  try {
    let result;
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    if (imageUrl) {
      const params = new URLSearchParams({
        q: question,
        uid: Math.floor(Math.random() * 1000000).toString(),
        imageUrl: imageUrl,
        apikey: "25644cdb-f51e-43f1-894a-ec718918e649"
      });
      const res = await axios.get(`https://kaiz-apis.gleeze.com/api/gemini-vision?${params}`, {
        headers: { "User-Agent": userAgent },
        timeout: 20000
      });
      result = res?.data?.response || "⚠️ No response from AI.";
    } else {
      const res = await axios.get(`https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(question)}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`, {
        headers: { "User-Agent": userAgent },
        timeout: 20000
      });
      result = res?.data?.response || "⚠️ No response from AI.";
    }

    const styledOutput = formatWithStyle(result);  
    const userName = (await api.getUserInfo(senderID))[senderID]?.name || "Unknown User";  

    const brandedMessage =  
      `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${styledOutput}\n\n•| 𝚄𝚜𝚎𝚛 𝚠𝚑𝚘 𝚊𝚜𝚔 : ${userName} |•`;  

    setTimeout(() => {  
      api.editMessage(brandedMessage, tempMsgID);  
      sessions.set(threadID, { lastBotMsgID: tempMsgID });  
    }, 5000);

  } catch (err) {
    api.editMessage("❌ Error processing your request.", tempMsgID);
  } finally {
    stopTyping(api, threadID); // Stop typing bubble
  }
}

module.exports.run = () => {};
