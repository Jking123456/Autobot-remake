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
  cooldown: 1200 // for reference only (20 mins = 1200s)
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, senderID } = event;

  // Unique cooldown key per user per thread
  const cooldownKey = `${threadID}-${senderID}`;

  // Check cooldown
  if (cooldowns.has(cooldownKey)) {
    const lastUsed = cooldowns.get(cooldownKey);
    const now = Date.now();
    const remaining = 20 * 60 * 1000 - (now - lastUsed);

    if (remaining > 0) {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      return api.sendMessage(`⏳ Please wait ${mins}m ${secs}s before using this command again.`, threadID);
    }
  }

  // Validate arguments
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

  const apiVersion = 'v12.0';
  const intervalMs = 1500;
  let count = 0;

  // Start cooldown
  cooldowns.set(cooldownKey, Date.now());

  const reportLoop = setInterval(async () => {
    try {
      await axios.post(`https://graph.facebook.com/${apiVersion}/${userId}/reports`, {
        access_token: accessToken,
        report_type: 'fake_account'
      });

      count++;
      console.log(`[${count}/${reportAmount}] Report sent for user ${userId}`);

      if (count >= reportAmount) {
        clearInterval(reportLoop);
        api.sendMessage('✅ DONE REPORTING.', threadID);
      }
    } catch (err) {
      console.error('❌ Report error:', err.response?.data || err.message);
    }
  }, intervalMs);

  // Safety: stop after expected time
  setTimeout(() => clearInterval(reportLoop), reportAmount * intervalMs + 1000);
};
