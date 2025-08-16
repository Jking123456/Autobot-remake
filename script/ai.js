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

// Send random "thinking..." message
function randomThinking(api, threadID, messageID) {
  const msg = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
  return new Promise(resolve => {
    api.sendMessage(msg, threadID, (err, info) => {
      if (err) return;
      resolve(info.messageID);
    });
  });
}

module.exports.config = {
  name: "ai",
  version: "1.2.0",
  permission: 0,
  credits: "UEP Goat Bot",
  description: "UEP Main Bot AI (Messenger-style)",
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
  const session = sessions.get(sessionKey) || { lastBotMsgID: null };

  // Cooldown
  if (isOnCooldown(threadID, senderID)) {
    return api.sendMessage("⏳ Please wait 5s before asking again.", threadID, messageID);
  }

  // Reset
  if (lower === "reset") {
    sessions.delete(sessionKey);
    return api.sendMessage("✅ Conversation reset. Type ai <message> to start again.", threadID, messageID);
  }

  // If replying to bot’s last message → continue conversation
  if (session.lastBotMsgID) {
    const isReply = messageReply && messageReply.messageID === session.lastBotMsgID;
    const isSameUser = messageReply && messageReply.senderID === senderID;
    if (isReply && isSameUser) {
      return processAI(api, threadID, senderID, text, sessionKey, messageID);
    }
  }

  // Start only if user types "ai ..."
  if (!lower.startsWith("ai ")) return;
  const question = text.slice(3).trim();
  if (!question) return;

  return processAI(api, threadID, senderID, question, sessionKey, messageID);
};

async function processAI(api, threadID, senderID, prompt, sessionKey, replyMsgID) {
  try {
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

    // Edit placeholder → final bot reply
    api.editMessage(branded, thinkingMsgID, () => {
      sessions.set(sessionKey, { lastBotMsgID: thinkingMsgID });
    });
  } catch (e) {
    console.error("AI Error:", e);
    api.sendMessage("❌ Error getting response from AI.", threadID, replyMsgID);
  }
}

module.exports.run = () => {};
