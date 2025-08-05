const axios = require('axios');

// In-memory store for user answers (can be reset if the bot restarts)
const currentQuiz = {};

module.exports.config = {
  name: "quiz",
  version: "1.0.0",
  hasPermission: 0,
  credits: "Homer Rebatis",
  description: "Get a quiz question and answer it",
  commandCategory: "game",
  usages: "[A/B/C/D]",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const userAnswer = args[0]?.toUpperCase();

  // If user submitted an answer like: quiz A / quiz B etc.
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

    // Clear user's quiz after answering
    delete currentQuiz[senderID];
    return;
  }

  // Otherwise, fetch a new quiz question
  try {
    const res = await axios.get("https://kaiz-apis.gleeze.com/api/quiz?limit=1&apikey=25644cdb-f51e-43f1-894a-ec718918e649");
    const data = res.data.questions[0];

    if (!data) return api.sendMessage("❌ No quiz data found.", threadID, messageID);

    // Save the current quiz per user
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
