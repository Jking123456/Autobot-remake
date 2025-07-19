module.exports = {
  config: {
    name: "autoreact",
    author: "Aminulsordar",
    version: "1.1",
    countDown: 5,
    role: 0,
    shortDescription: "Auto React to messages",
    longDescription: "Automatically reacts to keywords in messages with emojis.",
    category: "System",
    type: "event"
  },

  onStart: async function () {},

  onChat: async function ({ event, api }) {
    const message = (event.body || "").toLowerCase();

    const reactionsMap = {
      "😂": ["haha", "lol", "funny", "masaya", "🤣", "tumomba", "side eye", "awooop", "so masaya ka", "sana all"],
      "😭": ["iyak", "cry", "sad", "nasaktan", "iniwan", "lungkot"],
      "🥰": ["love", "mahal", "crush", "kilig", "sweet", "cute"],
      "😍": ["ganda", "gwapo", "hot", "sexy", "handsome", "pretty"],
      "🎮": ["game", "minecraft", "ml", "cod", "gaming"],
      "😡": ["galit", "inis", "angry", "bwisit", "pikon", "gago"],
      "🤔": ["ano daw", "what", "huh", "di ko gets", "talaga ba"],
      "💤": ["tulog", "antok", "sleepy", "boring"],
      "👍": ["agree", "yes", "go", "sige", "tama"],
      "⚠️": ["warning", "ingat", "bawal", "scam", "alert"]
    };

    for (const [reaction, keywords] of Object.entries(reactionsMap)) {
      if (keywords.some(word => message.includes(word))) {
        try {
          await api.setMessageReaction(reaction, event.messageID, () => {}, true);
        } catch (err) {
          console.error("Failed to set message reaction:", err);
        }
        break;
      }
    }
  }
};
