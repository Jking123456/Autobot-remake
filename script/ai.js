const axios = require("axios");

module.exports.config = {
  name: "ai",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Jay + UEP MAIN BOT Update",
  description: "AI Chatbot with reply system",
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
    // React with ⌛ to show "thinking"
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const response = await axios.get(apiUrl, getAxiosConfig());
    const answer = response.data.response;

    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    setTimeout(() => {
      api.sendMessage(
        `•| UEP MAIN BOT |•\n\n${answer}\n\n(𝚁𝚎𝚙𝚕𝚢 𝚝𝚘 𝚝𝚑𝚒𝚜 𝚒𝚖𝚊𝚐𝚎 𝚠/𝚘 '𝚊𝚒' 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 𝚝𝚘 𝚌𝚘𝚗𝚝𝚒𝚗𝚞𝚎 𝚌𝚘𝚗𝚟𝚎𝚛𝚜𝚊𝚝𝚒𝚘𝚗)`,
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
            // Change reaction to 🟢 when done
            api.setMessageReaction("🟢", event.messageID, () => {}, true);
          }
        },
        event.messageID
      );
    }, 5000);
  } catch (error) {
    console.error(error);
    api.sendMessage("Unexpected error from UEP MAIN BOT.", event.threadID, event.messageID);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};

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
    // React ⌛ while waiting
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const response = await axios.get(apiUrl, getAxiosConfig());
    const answer = response.data.response;

    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    setTimeout(() => {
      api.sendMessage(
        `•| 𝚄𝙴𝙿 𝙼𝙰𝙸𝙽 𝙱𝙾𝚃 |•\n\n${answer}\n\n(𝚁𝚎𝚙𝚕𝚢 "𝚛𝚎𝚜𝚎𝚝" 𝚝𝚘 𝚛𝚎𝚜𝚎𝚝 𝚜𝚎𝚜𝚜𝚒𝚘𝚗)`,
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
            // Change reaction to 🟢 when done
            api.setMessageReaction("🟢", event.messageID, () => {}, true);
          }
        },
        event.messageID
      );
    }, 5000);
  } catch (error) {
    console.error(error);
    api.sendMessage("Unexpected error from UEP MAIN BOT.", event.threadID, event.messageID);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
  }
};
