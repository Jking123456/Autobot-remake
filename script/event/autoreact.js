module.exports = {
  config: {
    name: "autoreact",
    author: "Aminulsordar",
    version: "1.1",
    countDown: 5,
    role: 0,
    shortDescription: "Auto React with emojis",
    longDescription: "Automatically reacts to keywords with appropriate emojis",
    category: "System",
  },

  onStart: async function () {},

  onChat: async function ({ event, api }) {
    const message = (event.body || "").toLowerCase();

    const reactionsMap = {
      "😂": ["haha", "lol", "funny", "hahah", "hahaha", "masaya", "happy", "🤣", "natomba", "tumomba", "tomomba", "tumumba", "tomumba", "side eye", "awooop", "so masaya ka", "sana all", "tangina mo gago"],
      "😭": ["cry", "iyak", "iyak na lang", "crying", "bakit ka malungkot", "hindi na", "sad ka", "walang ulam", "iniwan", "nasaktan", "na hurt", "lungkot"],
      "🥰": ["love", "mahal", "crush", "sweet", "cute", "inlove", "kilig", "heart"],
      "😍": ["ganda", "pogii", "gwapo", "ang hot", "sexy", "handsome", "pretty", "i like her", "i like him"],
      "🎮": ["laro", "laru", "game", "mc", "minecraft", "ml", "mlbb", "mobile legends", "cod", "call of duty", "rank", "g", "tara laro", "gaming"],
      "😡": ["galit", "badtrip", "inis", "angry", "pikon", "bwisit", "asar", "tanga", "gago ka"],
      "🤔": ["ano daw", "what", "huh", "di ko gets", "paano", "how", "bakit", "talaga ba", "seriously"],
      "💤": ["tulog", "antok", "sleepy", "zzz", "boring", "inaantok", "patulog", "sleep"],
      "👍": ["agree", "oo", "sige", "approve", "tama", "yes", "go", "let's go", "okay", "noted"],
      "⚠️": ["warning", "delikado", "ingat", "bawal", "scam", "loko", "alert", "problema"]
    };

    for (const [reaction, keywords] of Object.entries(reactionsMap)) {
      if (keywords.some((word) => message.includes(word))) {
        try {
          await api.setMessageReaction(reaction, event.messageID, () => {}, true);
        } catch (err) {
          console.error("Failed to set message reaction:", err);
        }
        break; // Only react once per message
      }
    }
  },
};
