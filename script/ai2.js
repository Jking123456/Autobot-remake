module.exports.config = {
  name: `ai2`,
  version: "1.1.0",
  permission: 0,
  credits: "Metoushela",
  description: "",
  prefix: false,
  premium: false,
  category: "without prefix",
  usage: ``,
  cooldowns: 3,
  dependency: {
    "axios": ""
  }
};

module.exports.run = async function ({api, event, args}) {
  try{
  const axios = require('axios');
  let ask = args.join(' ');
  if (!ask) {
    return api.sendMessage('Homer AI Bot\n━━━━━━━━━━━\n\nplease provide a question.', event.threadID, event.messageID)
  }

  const res = await axios.get(`https://haji-mix.up.railway.app/api/gpt4o?ask=${ask}&uid=${event.senderID}`);
  const reply = res.data.answer;
  if (res.error) {
    return api.sendMessage('having some unexpected error while fetching api.', event.threadID, event.messageID)
  } else {
    return api.sendMessage(`•| 𝙷𝙾𝙼𝙴𝚁 𝙰𝙸 𝙱𝙾𝚃 |•\n\n${reply}\n\n•| 𝙾𝚆𝙽𝙴𝚁 : 𝙷𝙾𝙼𝙴𝚁 𝚁𝙴𝙱𝙰𝚃𝙸𝚂 |•`, event.threadID, event.messageID)
  }
  } catch (error) {
    return api.sendMessage('having some unexpected error', event.threadID, event.messageID)
  }
}
