const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Homer Rebatis + Edited by Aligno + Modified by ChatGPT",
  description: "AI Chatbot (triggered when bot is mentioned)",
  usePrefix: false,
  commandCategory: "AI",
  usages: "Mention the bot with your question",
};

let sessions = {};       // per-user session tracking
let groupUsage = {};     // { threadID: { count, resetTime } }
let userCooldowns = {};  // per-user cooldown tracking

// --- USER-AGENTS + HEADERS RANDOMIZATION ---
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; rv:126.0) Gecko/20100101 Firefox/126.0",
];

const extraHeaders = [
  { "Accept-Language": "en-US,en;q=0.9" },
  { "Cache-Control": "no-cache" },
  { "Pragma": "no-cache" },
  { "Accept-Encoding": "gzip, deflate, br" },
  { "Connection": "keep-alive" },
];

function getAxiosConfig() {
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
  const header = extraHeaders[Math.floor(Math.random() * extraHeaders.length)];
  return { headers: { "User-Agent": ua, ...header } };
}

// --- GROUP LIMIT ---
function checkGroupLimit(threadID) {
  const now = Date.now();
  if (!groupUsage[threadID]) {
    groupUsage[threadID] = { count: 0, resetTime: now + 24 * 60 * 60 * 1000 };
  }

  const group = groupUsage[threadID];
  if (now > group.resetTime) {
    groupUsage[threadID] = { count: 0, resetTime: now + 24 * 60 * 60 * 1000 };
    return true;
  }

  if (group.count >= 5) return false; // block silently
  return true;
}

function incrementUsage(threadID) {
  if (groupUsage[threadID]) groupUsage[threadID].count++;
}

function getRemaining(threadID) {
  if (!groupUsage[threadID]) return 5;
  return 5 - groupUsage[threadID].count;
}

// --- USER COOLDOWN ---
function checkUserCooldown(userId) {
  const now = Date.now();
  if (!userCooldowns[userId]) {
    userCooldowns[userId] = now;
    return true;
  }
  if (now - userCooldowns[userId] < 5000) return false; // 5s cooldown
  userCooldowns[userId] = now;
  return true;
}

// --- MAIN HANDLER ---
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body, mentions } = event;

  // Only trigger if the bot is mentioned
  if (!mentions || !mentions[api.getCurrentUserID()]) return;

  const question = body.replace(/@\S+/g, "").trim(); // remove mention text
  if (!question) return;

  if (!checkGroupLimit(threadID)) return;
  if (!checkUserCooldown(senderID)) return;

  const apiUrl = `https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(
    question
  )}&uid=${senderID}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

  try {
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const response = await axios.get(apiUrl, getAxiosConfig());
    const answer = response.data.response;

    incrementUsage(threadID);
    const remaining = getRemaining(threadID);

    if (sessions[senderID]?.timeout) clearTimeout(sessions[senderID].timeout);

    api.sendMessage(
      `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}\n\n⚡ Tries left in this group: ${remaining}/5\n\n(Reply "reset" to reset session)`,
      threadID,
      (err, info) => {
        if (!err) {
          sessions[senderID] = {
            messageID: info.messageID,
            threadID,
            timeout: setTimeout(() => delete sessions[senderID], 15 * 60 * 1000),
          };
          api.setMessageReaction("🟢", event.messageID, () => {}, true);
        }
      },
      event.messageID
    );
  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};

// --- REPLIES ---
module.exports.handleReply = async function ({ api, event }) {
  const userId = event.senderID;
  const threadID = event.threadID;

  if (!sessions[userId]) return;
  if (event.messageReply?.messageID !== sessions[userId].messageID) return;

  const userMessage = event.body?.trim();
  if (!userMessage) return;

  if (userMessage.toLowerCase() === "reset") {
    delete sessions[userId];
    return api.sendMessage("✅ Session has been reset.", threadID, event.messageID);
  }

  if (!checkGroupLimit(threadID)) return;
  if (!checkUserCooldown(userId)) return;

  const apiUrl = `https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(
    userMessage
  )}&uid=${userId}&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

  try {
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const response = await axios.get(apiUrl, getAxiosConfig());
    const answer = response.data.response;

    incrementUsage(threadID);
    const remaining = getRemaining(threadID);

    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    api.sendMessage(
      `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}\n\n⚡ Tries left in this group: ${remaining}/5\n\n(Reply "reset" to reset session)`,
      threadID,
      (err, info) => {
        if (!err) {
          sessions[userId] = {
            messageID: info.messageID,
            threadID,
            timeout: setTimeout(() => delete sessions[userId], 15 * 60 * 1000),
          };
          api.setMessageReaction("🟢", event.messageID, () => {}, true);
        }
      },
      event.messageID
    );
  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};
