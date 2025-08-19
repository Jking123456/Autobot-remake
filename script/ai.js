const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "Homer Rebatis + Edited",
  description: "AI Chatbot with reply system (15 uses per group every 24h)",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[question]",
  cooldowns: 10,
};

let sessions = {}; // per-user session tracking
let groupUsage = {}; // { threadID: { count: number, resetTime: timestamp } }

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

  return {
    headers: {
      "User-Agent": ua,
      ...header,
    },
  };
}

// --- Check usage & reset logic ---
function checkGroupLimit(threadID) {
  const now = Date.now();
  if (!groupUsage[threadID]) {
    groupUsage[threadID] = { count: 0, resetTime: now + 24 * 60 * 60 * 1000 };
  }

  const group = groupUsage[threadID];

  // Reset if 24h passed
  if (now > group.resetTime) {
    groupUsage[threadID] = { count: 0, resetTime: now + 24 * 60 * 60 * 1000 };
    return true;
  }

  // Block if already 15 uses
  if (group.count >= 5) {
    return false; // block silently
  }

  return true;
}

function incrementUsage(threadID) {
  if (groupUsage[threadID]) {
    groupUsage[threadID].count++;
  }
}

function getRemaining(threadID) {
  if (!groupUsage[threadID]) return 5;
  return 5 - groupUsage[threadID].count;
}

// --- MAIN FUNCTION ---
module.exports.run = async function ({ api, event, args }) {
  const question = args.join(" ");
  if (!question) return;

  const threadID = event.threadID;
  const userId = event.senderID;

  // Check if group can still use AI
  if (!checkGroupLimit(threadID)) return; // silently ignore

  const apiUrl = `https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(
    question
  )}&uid=5&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

  try {
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const response = await axios.get(apiUrl, getAxiosConfig());
    const answer = response.data.response;

    incrementUsage(threadID);
    const remaining = getRemaining(threadID);

    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    setTimeout(() => {
      api.sendMessage(
        `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}\n\n⚡ Tries left in this group: ${remaining}/5\n\n(𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚝𝚑𝚒𝚜 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚠/𝚘 '𝚊𝚒' 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚝𝚘 𝚌𝚘𝚗𝚝𝚒𝚗𝚞𝚎 𝚌𝚘𝚗𝚟𝚎𝚛𝚜𝚊𝚝𝚒𝚘𝚗)`,
        threadID,
        (err, info) => {
          if (!err) {
            sessions[userId] = {
              messageID: info.messageID,
              threadID: threadID,
              timeout: setTimeout(() => {
                delete sessions[userId];
              }, 15 * 60 * 1000),
            };
            api.setMessageReaction("🟢", event.messageID, () => {}, true);
          }
        },
        event.messageID
      );
    }, 5000);
  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
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

  // Check if group can still use AI
  if (!checkGroupLimit(threadID)) return; // silently ignore

  const apiUrl = `https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(
    userMessage
  )}&uid=5&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

  try {
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const response = await axios.get(apiUrl, getAxiosConfig());
    const answer = response.data.response;

    incrementUsage(threadID);
    const remaining = getRemaining(threadID);

    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    setTimeout(() => {
      api.sendMessage(
        `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}\n\n⚡ Tries left in this group: ${remaining}/5\n\n(𝚁𝚎𝚙𝚕𝚢 "𝚛𝚎𝚜𝚎𝚝" 𝚝𝚘 𝚛𝚎𝚜𝚎𝚝 𝚜𝚎𝚜𝚜𝚒𝚘𝚗)`,
        threadID,
        (err, info) => {
          if (!err) {
            sessions[userId] = {
              messageID: info.messageID,
              threadID: threadID,
              timeout: setTimeout(() => {
                delete sessions[userId];
              }, 15 * 60 * 1000),
            };
            api.setMessageReaction("🟢", event.messageID, () => {}, true);
          }
        },
        event.messageID
      );
    }, 5000);
  } catch (error) {
    console.error(error);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};
