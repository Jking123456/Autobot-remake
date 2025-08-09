
const axios = require("axios");

// Cooldown storage
const textCooldowns = new Map();

// Trigger words (lowercase)
const triggerWords = [
"malupiton",
"kupal",
"ogag",
"boss",
"bossing",
"tagumpay",
"tarantado",
"tarub",
"aray"
];

module.exports.config = {
name: "malupiton",
version: "1.0.2",
permission: 0,
credits: "You",
description: "Auto-replies when trigger words are detected using Bossing API.",
prefix: false,
premium: false,
category: "without prefix",
usage: "Just type any trigger word",
cooldowns: 0 // custom cooldown used instead
};

module.exports.handleEvent = async function ({ api, event }) {
const { threadID, messageID, senderID, body, messageReply, isGroup } = event;

// Ignore empty or non-text messages
if (!body || typeof body !== "string") return;

// Fetch bot's own ID once
let botID;
try {
botID = api.getCurrentUserID();
} catch (err) {
console.warn("⚠️ Couldn't fetch bot ID:", err);
return; // safer to skip if we can't confirm bot ID
}

// Prevent replying to itself or another bot message
if (senderID === botID) return; // message from bot
if (messageReply && messageReply.senderID === botID) return; // reply to bot's message

// Check for trigger words (case-insensitive)
const lowerBody = body.toLowerCase();
if (!triggerWords.some(word => lowerBody.includes(word))) return;

// Cooldown per user
const now = Date.now();
const cooldownTime = 6000; // 6 seconds
if (textCooldowns.has(senderID) && now - textCooldowns.get(senderID) < cooldownTime) {
const timeLeft = Math.ceil((cooldownTime - (now - textCooldowns.get(senderID))) / 1000);
return api.sendMessage(⏳ Hoy, maghintay ka ng ${timeLeft} segundo muna bago magpadala ulit, Bossing., threadID, messageID);
}
textCooldowns.set(senderID, now);

// Prepare API request
const API_BASE = "https://markdevs-last-api-p2y6.onrender.com/bossing";
const UID = Math.floor(Math.random() * 1000000).toString();
const question = body.trim();

try {
const url = ${API_BASE}?prompt=${encodeURIComponent(question)}&uid=${encodeURIComponent(UID)};
const res = await axios.get(url, { timeout: 20000 });
const data = res?.data;

let replyText = "";  
if (typeof data === "string") {  
  replyText = data;  
} else if (data.response) {  
  replyText = data.response;  
} else if (data.data && data.data.response) {  
  replyText = data.data.response;  
} else {  
  replyText = JSON.stringify(data);  
}  

if (replyText.length > 1900) replyText = replyText.slice(0, 1900) + "\n\n... (trimmed)";  

const final = ` •| 𝙼𝙰𝙻𝚄𝙿𝙸𝚃𝙾𝙽  |•\n\n${replyText}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙰𝙽𝙾𝙽𝚈𝙼𝙾𝚄𝚂 𝙶𝚄𝚈 |•`;  

return api.sendMessage(final, threadID, messageID);

} catch (error) {
console.error("❌ Malupiton API Error:", error?.response?.data || error?.message || error);
return api.sendMessage("❌ May problema sa Bossing API. Subukan ulit mamaya, Bossing.", threadID, messageID);
}
};

module.exports.run = () => {
// This command is event-based
};

