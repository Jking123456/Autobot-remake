const axios = require("axios");

const userCooldowns = {}; // per-user cooldown
const COOLDOWN_DURATION = 5 * 1000; // 5 seconds per user

module.exports.config = {
  name: "google",
  version: "1.1.0",
  role: 0,
  hasPrefix: true,
  aliases: ["g", "search"],
  description: "Search Google and return the top results (safe with cooldown).",
  usage: "google <query>\nExamples:\n• google goat bot commands\n• g how to center a div",
  credits: "Homer Rebatis"
};

module.exports.run = onStart;
module.exports.onStart = onStart;

async function onStart({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // ✅ Cooldown per user
  if (userCooldowns[senderID]) {
    const remaining = COOLDOWN_DURATION - (Date.now() - userCooldowns[senderID]);
    if (remaining > 0) {
      return api.sendMessage(
        `⏳ Please wait ${(remaining / 1000).toFixed(1)} seconds before searching again.`,
        threadID,
        messageID
      );
    }
  }

  // E2EE detection
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.adminIDs || threadInfo.adminIDs.length === 0) {
      return api.sendMessage(
        "🔒 This conversation is in **End-to-End Encryption** mode.\n" +
        "Messenger bots cannot work here.\n➡ Please switch to a normal (non-secret) chat to use this command.",
        threadID,
        messageID
      );
    }

    // Bot admin restriction in groups
    if (threadInfo.isGroup) {
      const botID = api.getCurrentUserID();
      const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id == botID);
      if (!isBotAdmin) {
        return api.sendMessage(
          "🚫 Locked! To use this command in groups, make the bot an admin.",
          threadID,
          messageID
        );
      }
    }
  } catch (err) {
    return api.sendMessage(
      "⚠️ Unable to verify chat or admin status.\nMake sure the bot is admin and not in an encrypted conversation.",
      threadID,
      messageID
    );
  }

  // Validate query
  const query = args.join(" ").trim();
  if (!query) {
    return api.sendMessage(
      "🟡 Usage: google <query>\nExamples:\n• google goat bot commands\n• g how to center a div",
      threadID,
      messageID
    );
  }

  let placeholder;
  try {
    // Placeholder message
    placeholder = await api.sendMessage("⌛ Searching Google...", threadID);

    // Call search API
    const url = "https://rapido.zetsu.xyz/api/google?q=" + encodeURIComponent(query);
    const { data } = await axios.get(url, { timeout: 20000 });

    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return api.editMessage(`🔍 No results found for: “${query}”`, placeholder.messageID);
    }

    // Format top 8 results
    const results = data.results.slice(0, 8);
    const lines = [`🔎 Google results for: “${query}”\n`];

    for (let i = 0; i < results.length; i++) {
      const r = results[i] || {};
      const title = r.title || "(no title)";
      const link = r.link || "";
      const snippet = (r.snippet || "").trim();
      const host = r.displayLink ? ` — ${r.displayLink}` : "";

      lines.push(`${i + 1}. ${title}`);
      lines.push(link);
      if (snippet) lines.push(snippet);
      if (host) lines.push(host);
      if (i !== results.length - 1) lines.push("");
    }

    lines.push("\n💡 Tip: Use quotes or site: to refine your search.\nExample:\n• google site:github.com goat bot facebook\n• google \"goat bot\" admin commands");

    api.editMessage(lines.join("\n"), placeholder.messageID);

    // ✅ Set cooldown
    userCooldowns[senderID] = Date.now();

  } catch (err) {
    api.editMessage(
      "❌ Error fetching results.\n" +
      (err?.response?.status
        ? `Status: ${err.response.status}`
        : err?.code || err?.message || "Unknown error"),
      placeholder?.messageID || messageID
    );
  }
}
