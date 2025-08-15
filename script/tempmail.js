const axios = require('axios');

module.exports.config = {
  name: 'tempmail',
  version: '1.0.5',
  role: 0,
  hasPrefix: false,
  aliases: ['tempmail'],
  description: 'Generate a temporary email or check inbox messages automatically.',
  usage: 'temp gen | temp inbox',
  credits: 'Developer',
  cooldown: 300, // 5 minutes in seconds
};

// Store tokens per user
const userEmails = {};
const cooldowns = new Map();

module.exports.run = async function({ api, event, args, getThreadInfo }) {
  const subCommand = args[0];
  const senderId = event.senderID;
  const threadId = event.threadID;
  const isGroup = event.isGroup;

  // Check cooldown
  const lastUsed = cooldowns.get(senderId) || 0;
  const now = Date.now();
  if (now - lastUsed < 5 * 60 * 1000) { // 5 minutes
    return api.sendMessage(`⏳ Please wait ${Math.ceil((5*60*1000 - (now - lastUsed))/1000)} seconds before using this command again.`, threadId, event.messageID);
  }

  // Restriction for group chats
  if (isGroup) {
    const threadInfo = await getThreadInfo(threadId);
    const botID = api.getCurrentUserID();
    if (!threadInfo.adminIDs.some(admin => admin.id == botID)) {
      return api.sendMessage('🚫Command Lock! to use this command, promote me as admin this group.', threadId, event.messageID);
    }
  }

  cooldowns.set(senderId, now);

  const apiGen = 'https://haji-mix.up.railway.app/api/tempgen';
  const apiInbox = 'https://haji-mix.up.railway.app/api/tempinbox?token=';

  const waitingMsg = '⌛ Please wait...';
  api.sendMessage(waitingMsg, threadId, async (err, info) => {
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
