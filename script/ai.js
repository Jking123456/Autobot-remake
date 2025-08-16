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
    const response = await axios.get(apiUrl);
    const answer = response.data.response;

    // reset timer if already exists
    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    // reply after 5s delay
    setTimeout(() => {
      api.sendMessage(
        `•| UEP MAIN BOT |•\n\n${answer}\n\n(Reply "reset" to reset session)`,
        event.threadID,
        (err, info) => {
          if (!err) {
            sessions[userId] = {
              messageID: info.messageID,
              threadID: event.threadID,
              timeout: setTimeout(() => {
                delete sessions[userId];
              }, 15 * 60 * 1000), // auto reset after 15 minutes
            };
          }
        },
        event.messageID
      );
    }, 5000);
  } catch (error) {
    console.error(error);
    api.sendMessage("Unexpected error from UEP MAIN BOT.", event.threadID, event.messageID);
  }
};

module.exports.handleEvent = async function ({ api, event }) {
  const userId = event.senderID;

  // check if user has active session
  if (!sessions[userId]) return;

  // check if reply is under bot's last message
  if (event.messageReply?.messageID !== sessions[userId].messageID) return;

  const userMessage = event.body?.trim();
  if (!userMessage) return;

  // reset session if user types "reset"
  if (userMessage.toLowerCase() === "reset") {
    delete sessions[userId];
    return api.sendMessage("✅ Session has been reset.", event.threadID, event.messageID);
  }

  const apiUrl = `https://kaiz-apis.gleeze.com/api/llama3-turbo?ask=${encodeURIComponent(
    userMessage
  )}&uid=5&apikey=25644cdb-f51e-43f1-894a-ec718918e649`;

  try {
    const response = await axios.get(apiUrl);
    const answer = response.data.response;

    // reset timer
    if (sessions[userId]?.timeout) clearTimeout(sessions[userId].timeout);

    // reply after 5s delay
    setTimeout(() => {
      api.sendMessage(
        `•| UEP MAIN BOT |•\n\n${answer}\n\n(Reply "reset" to reset session)`,
        event.threadID,
        (err, info) => {
          if (!err) {
            sessions[userId] = {
              messageID: info.messageID,
              threadID: event.threadID,
              timeout: setTimeout(() => {
                delete sessions[userId];
              }, 15 * 60 * 1000), // auto reset after 15 minutes
            };
          }
        },
        event.messageID
      );
    }, 5000);
  } catch (error) {
    console.error(error);
    api.sendMessage("Unexpected error from UEP MAIN BOT.", event.threadID, event.messageID);
  }
};
