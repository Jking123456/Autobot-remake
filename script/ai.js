const axios = require("axios");

// --- PROXY LIST ---
const proxies = [
  { host: "104.207.32.238", port: 3128 },
  { host: "45.76.186.44", port: 8080 },
  { host: "195.154.255.194", port: 8000 },
];

module.exports.config = {
  name: "ai",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Homer Rebatis",
  description: "AI Chatbot with reply system (anti-meta detection)",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[question]",
  cooldowns: 10,
};

let sessions = {}; // per-user session tracking

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

// --- AXIOS CONFIG BUILDER WITH ROTATION ---
function getAxiosConfig() {
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
  const header = extraHeaders[Math.floor(Math.random() * extraHeaders.length)];
  const proxy = proxies[Math.floor(Math.random() * proxies.length)];

  return {
    headers: {
      "User-Agent": ua,
      ...header,
    },
    proxy, // rotate proxy
    timeout: 15000, // fail fast if proxy is dead
  };
}

// --- MAIN FUNCTION ---
module.exports.run = async function ({ api, event, args }) {
  const question = args.join(" ");
  if (!question) {
    return api.sendMessage(
      "Please provide a question! Example: ai what is love?",
      event.threadID,
      event.messageID
    );
  }

  const userId = event.senderID;
  const apiUrl = `https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(
    question
  )}&uid=5&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

  try {
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const response = await axios.get(apiUrl, getAxiosConfig());
    const answer = response.data.response;

    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    setTimeout(() => {
      api.sendMessage(
        `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}\n\n(Reply without 'ai' to continue conversation)`,
        event.threadID,
        (err, info) => {
          if (!err) {
            sessions[userId] = {
              messageID: info.messageID,
              threadID: event.threadID,
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
    console.error("AI Error:", error.message || error);
    api.sendMessage("Unexpected error from UEP MAIN BOT.", event.threadID, event.messageID);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};

// --- HANDLE REPLIES / CONVERSATION ---
module.exports.handleEvent = async function ({ api, event }) {
  const userId = event.senderID;
  if (!sessions[userId]) return;
  if (event.messageReply?.messageID !== sessions[userId].messageID) return;

  const userMessage = event.body?.trim();
  if (!userMessage) return;

  if (userMessage.toLowerCase() === "reset") {
    delete sessions[userId];
    return api.sendMessage("✅ Session has been reset.", event.threadID, event.messageID);
  }

  const apiUrl = `https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(
    userMessage
  )}&uid=5&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

  try {
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const response = await axios.get(apiUrl, getAxiosConfig());
    const answer = response.data.response;

    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    setTimeout(() => {
      api.sendMessage(
        `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}\n\n(Reply \"reset\" to reset session)`,
        event.threadID,
        (err, info) => {
          if (!err) {
            sessions[userId] = {
              messageID: info.messageID,
              threadID: event.threadID,
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
    console.error("AI Error:", error.message || error);
    api.sendMessage("Unexpected error from UEP MAIN BOT.", event.threadID, event.messageID);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};
