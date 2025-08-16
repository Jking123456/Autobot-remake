const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Homer Rebatis",
  description: "AI Chatbot with reply system (anti-meta detection)",
  usePrefix: true,
  commandCategory: "AI",
  usages: "[question]",
  cooldowns: 10,
};

let sessions = {}; // per-user session tracking

// --- USER-AGENTS + HEADER RANDOMIZATION ---
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; rv:126.0) Gecko/20100101 Firefox/126.0",
];

const headerPresets = [
  {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Connection": "keep-alive",
    "Referer": "https://www.google.com/",
  },
  {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-GB,en;q=0.8",
    "Connection": "keep-alive",
    "Origin": "https://www.facebook.com",
    "Referer": "https://m.facebook.com/",
  },
  {
    "Accept": "*/*",
    "Accept-Language": "en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Upgrade-Insecure-Requests": "1",
  },
];

// Shuffle headers object order for randomness
function shuffleObject(obj) {
  const keys = Object.keys(obj).sort(() => Math.random() - 0.5);
  const shuffled = {};
  keys.forEach((k) => (shuffled[k] = obj[k]));
  return shuffled;
}

function getAxiosConfig() {
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
  const headerSet = headerPresets[Math.floor(Math.random() * headerPresets.length)];
  return {
    headers: {
      "User-Agent": ua,
      ...shuffleObject(headerSet),
    },
    timeout: 15000, // avoid hanging forever
  };
}

// --- Delay utility to simulate "human typing" ---
function randomDelay(min = 1000, max = 4000) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );
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

    await randomDelay(); // randomized delay before request
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
    }, 2000 + Math.random() * 2000); // variable delay in reply
  } catch (error) {
    console.error("AI API Error:", error.message);
    api.sendMessage("❌ Unexpected error from UEP MAIN BOT.", event.threadID, event.messageID);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};
