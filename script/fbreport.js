const axios = require('axios');

// Cooldown memory map
const cooldowns = new Map();

module.exports.config = {
  name: "fbreport",
  aliases: ["report"],
  version: "2.0",
  role: 2,
  hasPrefix: false,
  credits: "cliff (improved by Bogart)",
  description: "Report a Facebook account",
  usage: "report [token or cookie] [user_id] [amount]",
  cooldown: 60 // 1 minute
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, senderID } = event;
  const cooldownKey = `${senderID}`;

  // Cooldown check
  if (cooldowns.has(cooldownKey)) {
    const lastUsed = cooldowns.get(cooldownKey);
    const now = Date.now();
    const remaining = 60 * 1000 - (now - lastUsed);

    if (remaining > 0) {
      const secs = Math.floor(remaining / 1000);
      return api.sendMessage(`⏳ Please wait ${secs}s before using this command again.`, threadID);
    }
  }

  // Argument check
  if (args.length !== 3) {
    return api.sendMessage('❌ Invalid format.\nUsage: report [token or cookie] [user_id] [amount]', threadID);
  }

  const [accessToken, userId, rawAmount] = args;
  const reportAmount = parseInt(rawAmount);

  if (isNaN(reportAmount) || reportAmount <= 0) {
    return api.sendMessage('❌ Invalid amount. Please provide a number greater than 0.', threadID);
  }

  if (reportAmount > 100) {
    return api.sendMessage('⚠️ Maximum allowed reports is 100.', threadID);
  }

  // Start reporting
  cooldowns.set(cooldownKey, Date.now());

  api.sendMessage(`📨 Sending ${reportAmount} reports to user ID ${userId}...`, threadID);

  const apiVersion = 'v12.0';
  const intervalMs = 1500;
  let count = 0;

  const reportLoop = setInterval(async () => {
    try {
      const res = await axios.post(`https://graph.facebook.com/${apiVersion}/${userId}/reports`, {
        access_token: accessToken,
        report_type: 'fake_account'
      });

      count++;
      console.log(`[${count}/${reportAmount}] Report sent:`, res.data);

      if (count >= reportAmount) {
        clearInterval(reportLoop);
        api.sendMessage(`✅ Done sending ${count} reports to ${userId}.`, threadID);
      }

    } catch (err) {
      console.error('❌ Report error:', err.response?.data || err.message);

      // Send error to user
      api.sendMessage(`❌ Failed to report:\n${JSON.stringify(err.response?.data || err.message)}`, threadID);
      
      clearInterval(reportLoop);
    }
  }, intervalMs);

  // Safety timeout
  setTimeout(() => clearInterval(reportLoop), reportAmount * intervalMs + 1000);
};
