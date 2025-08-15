const axios = require('axios');

module.exports.config = {
  name: 'tempmail',
  version: '1.0.4',
  role: 0,
  hasPrefix: false,
  aliases: ['tempmail'],
  description: 'Generate a temporary email or check inbox messages automatically.',
  usage: 'temp gen | temp inbox',
  credits: 'Developer',
  cooldown: 3,
};

// Store tokens per user
const userEmails = {};

module.exports.run = async function({ api, event, args }) {
  const subCommand = args[0];
  const senderId = event.senderID;
  const apiGen = 'https://haji-mix.up.railway.app/api/tempgen';
  const apiInbox = 'https://haji-mix.up.railway.app/api/tempinbox?token=';

  const waitingMsg = '⌛ Please wait...';
  api.sendMessage(waitingMsg, event.threadID, async (err, info) => {
    if (err) return;

    try {
      // Generate new email
      if (subCommand === 'gen') {
        const { data } = await axios.get(apiGen);
        if (!data.email || !data.token) {
          return api.editMessage('❌ Error: Could not generate email.', info.messageID);
        }

        // Save the token for this user
        userEmails[senderId] = {
          email: data.email,
          token: data.token
        };

        const message = `📩 Email: ${data.email}\n\n🔎 Check inbox anytime: temp inbox`;
        return api.editMessage(message, info.messageID);

      } 
      // Check inbox automatically for the last generated email
      else if (subCommand === 'inbox' || !subCommand) {
        const userData = userEmails[senderId];
        if (!userData) {
          return api.editMessage('❌ No email found. Generate one first using "temp gen".', info.messageID);
        }

        const { data } = await axios.get(`${apiInbox}${encodeURIComponent(userData.token)}`);

        if (!data.emails || data.emails.length === 0) {
          return api.editMessage(`📭 No messages yet for your temporary email (${userData.email}).`, info.messageID);
        }

        let inboxText = `📬 Inbox for ${userData.email}:\n`;
        data.emails.forEach(msg => {
          inboxText += `\n📑 Title: ${msg.subject}\n✉️ Body: ${msg.body_text}\n----------------------------`;
        });

        return api.editMessage(inboxText, info.messageID);

      } else {
        return api.editMessage('Usage:\n• temp gen\n• temp inbox', info.messageID);
      }

    } catch (error) {
      console.error('Temp command error:', error.message);
      return api.editMessage('❌ Error: Can’t connect to Tempmail API.', info.messageID);
    }
  });
};
