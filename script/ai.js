const axios = require("axios");

// Cooldowns & sessions
const cooldowns = new Map(); 
const sessions = new Map();  

// Thinking placeholders
const thinkingMessages = [
  "💭 Thinking...",
  "⏳ Just a sec...",
  "🤔 Processing...",
  "💬 Typing...",
  "📡 Connecting..."
];

// User agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Mozilla/5.0 (Linux; Android 10)",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
];

// Config
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Cooldown check
function isOnCooldown(threadID, senderID, cooldownMs = 5000) {
  const key = `${threadID}_${senderID}`;
  const now = Date.now();
  if (cooldowns.has(key) && now - cooldowns.get(key) < cooldownMs) {
    return true;
  }
  cooldowns.set(key, now);
  return false;
}

// Send random "thinking..." under user’s message
function randomThinking(api, threadID, replyToID) {
  const msg = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
  return new Promise(resolve => {
    api.sendMessage({ body: msg, replyToMessageID: replyToID }, threadID, (err, info) => {
      if (err) return;
      resolve(info.messageID);
    });
  });
}

module.exports.config = {
  name: "ai",
  version: "1.5.0",
  permission: 0,
  credits: "UEP Goat Bot (ChatGPT enhanced)",
  description: "Messenger-style AI that replies under user’s message (with auto reset)",
  prefix: false,
  category: "without prefix",
  usage: "ai <your message>",
  cooldowns: 0
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;

  // Ignore self
  let botID;
  try { botID = api.getCurrentUserID(); } catch { return; }
  if (senderID === botID) return;

  const text = body.trim();
  const lower = text.toLowerCase();

  const sessionKey = `${threadID}_${senderID}`;
  let session = sessions.get(sessionKey);

  // Clean expired session
  if (session && Date.now() - session.lastActive > SESSION_TIMEOUT) {
    sessions.delete(sessionKey);
    session = null;
  }

  // Cooldown
  if (isOnCooldown(threadID, senderID)) {
    return api.sendMessage({ body: "⏳ Please wait 5s before asking again.", replyToMessageID: messageID }, threadID);
  }

  // Reset
  if (lower === "reset") {
    sessions.delete(sessionKey);
    return api.sendMessage({ body: "✅ Conversation reset. Type ai <message> to start again.", replyToMessageID: messageID }, threadID);
  }

  // If user is replying to bot → continue convo under their *original* message
  if (session && messageReply && messageReply.messageID === session.lastBotMsgID) {
    return processAI(api, threadID, senderID, text, sessionKey, session.originalUserMsgID);
  }

  // Start only if user types "ai ..."
  if (!lower.startsWith("ai ")) return;
  const question = text.slice(3).trim();
  if (!question) return;

  // Save this user’s original message ID
  return processAI(api, threadID, senderID, question, sessionKey, messageID, true);
};

async function processAI(api, threadID, senderID, prompt, sessionKey, replyMsgID, isNew = false) {
  try {
    // Show thinking...
    const thinkingMsgID = await randomThinking(api, threadID, replyMsgID);
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // Call API
    const res = await axios.get(
      `https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(prompt)}&uid=${senderID}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`,
      { headers: { "User-Agent": userAgent }, timeout: 20000 }
    );

    const answer = res?.data?.response || "⚠️ No response from AI.";
    const userName = (await api.getUserInfo(senderID))[senderID]?.name || "Unknown User";

    const branded =
`🤖 **UEP MAIN BOT**
━━━━━━━━━━━━━━━
${answer}
━━━━━━━━━━━━━━━
ask by : **${userName}**
🔄 Reply "reset" anytime to reset conversation.
💡 Reply to this message to continue.`;

    // Send final reply under the *user’s original message*
    api.sendMessage({ body: branded, replyToMessageID: replyMsgID }, threadID, (err, info) => {
      if (!err) {
        sessions.set(sessionKey, { 
          lastBotMsgID: info.messageID,
          originalUserMsgID: isNew ? replyMsgID : sessions.get(sessionKey)?.originalUserMsgID || replyMsgID,
          lastActive: Date.now()
        });
      }
    });

    // Delete "thinking..." if possible
    if (typeof api.unsendMessage === "function") {
      api.unsendMessage(thinkingMsgID);
    }
  } catch (e) {
    console.error("AI Error:", e);
    api.sendMessage({ body: "❌ Error getting response from AI.", replyToMessageID: replyMsgID }, threadID);
  }
}

module.exports.run = () => {};
