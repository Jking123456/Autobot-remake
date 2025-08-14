const axios = require('axios');

const currentQuiz = {};
const cooldowns = new Map(); // Track per-user cooldown

module.exports.config = {
  name: "quiz",
  version: "1.1.0",
  hasPermission: 0,
  credits: "Homer Rebatis + ChatGPT",
  description: "Get a quiz question and answer it",
  commandCategory: "game",
  usages: "[A/B/C/D]",
  cooldowns: 60, // Default cooldown (seconds)
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, isGroup } = event;

  // Check if in a group and bot is admin
  if (isGroup) {
    const botInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const botIsAdmin = botInfo.adminIDs.some(ad => ad.id == botID);

    if (!botIsAdmin) {
      return api.sendMessage("⚠️ I need to be an admin in this group to run quizzes. Please promote me first!", threadID, messageID);
    }
  }

  // Check cooldown
  const lastUsed = cooldowns.get(senderID) || 0;
  const now = Date.now();
  if (now - lastUsed < 60 * 1000) { // 60 seconds cooldown
    const remaining = Math.ceil((60 * 1000 - (now - lastUsed)) / 1000);
    return api.sendMessage(`⏳ Please wait ${remaining} seconds before using the quiz again.`, threadID, messageID);
  }
  cooldowns.set(senderID, now);

  const userAnswer = args[0]?.toUpperCase();

  // Answering a quiz
  if (userAnswer && ["A", "B", "C", "D"].includes(userAnswer)) {
    const quiz = currentQuiz[senderID];
    if (!quiz) {
      return api.sendMessage("❌ You haven't started a quiz yet. Type 'quiz' to begin!", threadID, messageID);
    }

    const correct = quiz.correct_answer.toUpperCase();
    if (userAnswer === correct) {
      api.sendMessage("✅ Correct! Well done 👏", threadID, messageID);
    } else {
      api.sendMessage(`❌ Incorrect. The correct answer was: ${correct} 😝`, threadID, messageID);
    }

    delete currentQuiz[senderID];
    return;
  }

  // Fetch new quiz
  try {
    const res = await axios.get("https://kaiz-apis.gleeze.com/api/quiz?limit=1&apikey=25644cdb-f51e-43f1-894a-ec718918e649");
    const data = res.data.questions[0];

    if (!data) return api.sendMessage("❌ No quiz data found.", threadID, messageID);

    currentQuiz[senderID] = data;

    const questionText = 
`🧠 𝗤𝘂𝗶𝘇 𝗧𝗶𝗺𝗲!
━━━━━━━━━━━━━
📌 𝗤𝘂𝗲𝘀𝘁𝗶𝗼𝗻: ${data.question}
🎯 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${data.category}
📊 𝗗𝗶𝗳𝗳𝗶𝗰𝘂𝗹𝘁𝘆: ${data.difficulty}
━━━━━━━━━━━━━
A. ${data.choices.A}
B. ${data.choices.B}
C. ${data.choices.C}
D. ${data.choices.D}
━━━━━━━━━━━━━
✅ Answer by typing: quiz A / quiz B / quiz C / quiz D`;

    return api.sendMessage(questionText, threadID, messageID);

  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Failed to fetch quiz. Please try again later.", threadID, messageID);
  }
};
